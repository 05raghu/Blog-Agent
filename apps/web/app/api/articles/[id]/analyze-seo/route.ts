// API route: POST /api/articles/[id]/analyze-seo — Analyze article for SEO
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, content, brief } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const provider = await getTextModelProvider();
    const analysis = await provider.analyzeSEO({
      title,
      content,
      brief: brief || '',
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('[API] SEO analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SEO', message: (error as Error).message },
      { status: 500 }
    );
  }
}
