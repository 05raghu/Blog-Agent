// API route: POST /api/articles/generate-images — Auto-generate image prompts for article
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest) {
  try {
    const { title, brief, outline } = await request.json();

    if (!title || !brief) {
      return NextResponse.json(
        { error: 'title and brief are required' },
        { status: 400 }
      );
    }

    const provider = await getTextModelProvider();

    // Generate image prompts using the text model
    // Create a draft-like prompt structure for image suggestions
    const imageBrief = `Generate 3-4 detailed image prompts for this article:

Title: ${title}
Brief: ${brief}
${outline ? `Outline:\n${outline}` : ''}

For each image, provide:
1. Hero image (main article image)
2-4. Section images (supporting visuals)

Format: [Image N - Type]: <detailed prompt>`;

    const imagePrompts = await provider.generateDraft({
      title: `Image Prompts for: ${title}`,
      brief: imageBrief,
      outline: 'Generate detailed visual descriptions',
      targetLength: 1000,
    });

    // Parse the image prompts
    const images = imagePrompts
      .split('\n')
      .filter((line: string) => line.includes('Image'))
      .map((line: string) => ({
        prompt: line.trim(),
        generated: false,
      }));

    return NextResponse.json({
      success: true,
      imagePrompts,
      images,
    });
  } catch (error) {
    console.error('[API] Generate images error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image prompts', message: (error as Error).message },
      { status: 500 }
    );
  }
}
