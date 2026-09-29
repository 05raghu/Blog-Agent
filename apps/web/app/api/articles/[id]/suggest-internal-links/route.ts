// API route: POST /api/articles/[id]/suggest-internal-links — Suggest internal links
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { articleStore } from '../../store';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, content, strategyId } = await request.json();

    if (!title || !strategyId) {
      return NextResponse.json(
        { error: 'Title and strategyId are required' },
        { status: 400 }
      );
    }

    // Get all articles in the same strategy (excluding self)
    const allArticles = Array.from(articleStore.values()).filter(
      (a) => a.strategyId === strategyId && a.id !== params.id
    );

    if (allArticles.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Prepare candidates for LLM
    const candidates = allArticles.map((article) => ({
      id: article.id,
      title: article.title,
      excerpt: (article.content || article.brief || '').substring(0, 300),
    }));

    // Get link suggestions from provider
    const provider = await getTextModelProvider();
    const suggestions = await provider.suggestInternalLinks({
      currentTitle: title,
      currentContent: content || '',
      candidates,
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('[API] Crosslink suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest links', message: (error as Error).message },
      { status: 500 }
    );
  }
}
