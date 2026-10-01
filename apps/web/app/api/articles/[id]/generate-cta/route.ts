// API route: POST /api/articles/[id]/generate-cta — Generate CTA suggestions
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest) {
  try {
    const { title, content, brief, targetAudience } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const provider = await getTextModelProvider();
    const result = await provider.generateCTA({
      title,
      content,
      brief: brief || '',
      targetAudience: targetAudience || '',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Generate CTA error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CTA', message: (error as Error).message },
      { status: 500 }
    );
  }
}
