// API route: POST /api/articles/generate-brief — Generate brief from topic title
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest) {
  try {
    const { title, angle, targetOffering, targetAudience } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    const provider = await getTextModelProvider();
    const brief = await provider.generateBrief({
      title,
      angle,
      targetOffering,
      targetAudience,
    });

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error) {
    console.error('[API] Generate brief error:', error);
    return NextResponse.json(
      { error: 'Failed to generate brief', message: (error as Error).message },
      { status: 500 }
    );
  }
}
