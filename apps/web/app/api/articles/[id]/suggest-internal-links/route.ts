// API route: POST /api/articles/[id]/suggest-internal-links — Suggest internal links
// Uses centralized provider (OpenAI, Anthropic, or Mock)
// Fetches candidate articles from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const { title, content, strategyId } = await request.json();

    if (!title || !strategyId) {
      return NextResponse.json(
        { error: 'Title and strategyId are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get all articles in the same strategy (excluding self)
    const { data: allArticles, error } = await supabase
      .from('articles')
      .select('id, title, content, brief')
      .eq('workspace_id', workspace.workspaceId)
      .eq('strategy_id', strategyId)
      .neq('id', params.id);

    if (error || !allArticles || allArticles.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Prepare candidates for LLM
    const candidates = allArticles.map((article: any) => ({
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
