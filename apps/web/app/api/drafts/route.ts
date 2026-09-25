// API route: POST /api/drafts — Generate a blog draft
// MVP endpoint for marketing demo
// Uses centralized provider (OpenAI, Anthropic, or Mock)

import { NextRequest, NextResponse } from 'next/server';
import { ArticleService, type ArticleBrief, type GeneratedDraft } from '@blog-agent/domain';
import { getTextModelProvider } from '@/lib/text-model';

// Temporary in-memory store (replace with DB later)
const draftStore = new Map<string, { brief: ArticleBrief; draft: GeneratedDraft }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, topic, brief, outline, voiceProfile, targetLength } = body;

    if (!brief || !outline) {
      return NextResponse.json(
        { error: 'Missing required fields: brief, outline' },
        { status: 400 }
      );
    }

    // Initialize TextModel provider (can be mock or live)
    const textModelProvider = await getTextModelProvider();
    const articleService = new ArticleService(textModelProvider);

    // Generate draft
    const briefObj: ArticleBrief = {
      title: title || 'Untitled Article',
      topic: topic || 'Technology',
      brief,
      outline,
      voiceProfile,
      targetLength,
    };

    console.log(`[API] Generating draft for: ${briefObj.title}`);
    const draft = await articleService.generateDraft(briefObj);

    // Store in memory (TODO: persist to DB)
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    draftStore.set(draftId, { brief: briefObj, draft });

    return NextResponse.json({
      draftId,
      title: briefObj.title,
      topic: briefObj.topic,
      content: draft.content,
      wordCount: draft.wordCount,
      generatedAt: draft.generatedAt,
      status: 'generated',
    });
  } catch (error) {
    console.error('[API] Draft generation error:', error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Text model not configured',
          message: error.message,
          hint: 'To use live Claude API, set ANTHROPIC_API_KEY environment variable',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate draft', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const draftId = request.nextUrl.searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ error: 'Missing draft ID' }, { status: 400 });
    }

    const stored = draftStore.get(draftId);
    if (!stored) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({
      draftId,
      title: stored.brief.title,
      topic: stored.brief.topic,
      content: stored.draft.content,
      wordCount: stored.draft.wordCount,
      generatedAt: stored.draft.generatedAt,
      status: 'generated',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve draft', message: (error as Error).message },
      { status: 500 }
    );
  }
}
