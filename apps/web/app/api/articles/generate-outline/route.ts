// API route: POST /api/articles/generate-outline — Generate outline
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest) {
  try {
    const { brief, title, targetAudience } = await request.json();

    if (!brief || !title) {
      return NextResponse.json(
        { error: 'brief and title are required' },
        { status: 400 }
      );
    }

    const provider = await getTextModelProvider();
    const outline = await provider.generateOutline({
      title,
      brief,
      targetAudience,
    });

    return NextResponse.json({
      success: true,
      outline,
    });
  } catch (error) {
    console.error('[API] Generate outline error:', error);
    return NextResponse.json(
      { error: 'Failed to generate outline', message: (error as Error).message },
      { status: 500 }
    );
  }
}
