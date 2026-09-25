// API route: POST /api/articles/generate-links — Auto-generate relevant links and sources
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';

export async function POST(request: NextRequest) {
  try {
    const { content, title } = await request.json();

    if (!content || !title) {
      return NextResponse.json(
        { error: 'content and title are required' },
        { status: 400 }
      );
    }

    const provider = await getTextModelProvider();

    // Generate links using the text model
    const linkPrompt = `Analyze this article and add 5-7 relevant markdown links [text](url) throughout.

Article Title: ${title}
Content: ${content}

Requirements:
- Use format: [link text](https://example.com)
- ONE URL per link only
- Real authoritative sources only
- Return ONLY the rewritten article with links
- NO explanations or extras`;

    const contentWithLinks = await provider.generateDraft({
      title: `Add Links to: ${title}`,
      brief: linkPrompt,
      outline: 'Add relevant internal and external links',
      targetLength: content.length,
    });

    return NextResponse.json({
      success: true,
      content: contentWithLinks || content,
    });
  } catch (error) {
    console.error('[API] Generate links error:', error);
    return NextResponse.json(
      { error: 'Failed to generate links', message: (error as Error).message },
      { status: 500 }
    );
  }
}
