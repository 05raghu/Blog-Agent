// API route: POST /api/articles/generate-draft — Generate article draft
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest) {
  try {
    const { title, brief, outline, targetAudience } = await request.json();

    if (!title || !brief || !outline) {
      return NextResponse.json(
        { error: 'title, brief, and outline are required' },
        { status: 400 }
      );
    }

    const provider = await getTextModelProvider();
    const draft = await provider.generateDraft({
      title,
      brief,
      outline,
      targetAudience,
      targetLength: 2000,
    });

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error) {
    console.error('[API] Generate draft error:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft', message: (error as Error).message },
      { status: 500 }
    );
  }
}
