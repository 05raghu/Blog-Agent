// API route: POST /api/drafts — Generate a blog draft
// MVP endpoint for marketing demo

import { NextRequest, NextResponse } from 'next/server';
import { ArticleService, type ArticleBrief, type GeneratedDraft } from '@blog-agent/domain';

// Temporary in-memory store (replace with DB later)
const draftStore = new Map<string, { brief: ArticleBrief; draft: GeneratedDraft }>();

// Provider that checks for real API key, falls back to mock
async function getTextModelProvider() {
  const apiKey = process.env.OPENAI_API_KEY;

  // If API key exists, use real OpenAI
  if (apiKey && apiKey.startsWith('sk-')) {
    try {
      const { OpenAITextModel } = await import('@blog-agent/integrations');
      const provider = new OpenAITextModel(apiKey);
      return provider;
    } catch (e) {
      console.error('[API] OpenAI SDK not available, falling back to mock');
      return getMockProvider();
    }
  }

  // Fall back to mock provider
  return getMockProvider();
}

// Mock provider function
function getMockProvider() {
  return {
    async generateDraft({ brief, outline, targetLength }: any) {
      const title = brief.split('\n')[0] || 'Article Title';
      const wordCount = targetLength || 2000;

      const sections = outline
        .split('\n')
        .filter((s: string) => s.trim())
        .map((s: string) => `## ${s.trim()}\n\nKey content for this section...`)
        .join('\n\n');

      return `# ${title}\n\n## Introduction\n\nThis article explores critical insights relevant to your audience.\n\n${sections}\n\n## Conclusion\n\nThese evidence-backed insights provide actionable value for decision-makers.\n\n---\n*Word count: ~${wordCount} words*`;
    },

    async generateCritique({ current }: any) {
      const wordCount = current.split(/\s+/).length;
      const hasExamples = /example|case|demonstrate/i.test(current);
      const hasData = /data|research|found|study/i.test(current);
      const hasCTA = /next step|action|contact|learn/i.test(current);

      let score = 50;
      if (wordCount > 1500) score += 15;
      if (hasExamples) score += 15;
      if (hasData) score += 15;
      if (hasCTA) score += 5;

      const issues: Array<{severity: 'p0'|'p1'|'p2'|'p3'; category: 'evidence'|'clarity'|'brand'|'engagement'; message: string}> = [];

      if (!hasData) {
        issues.push({ severity: 'p1', category: 'evidence', message: 'Add data-backed claims' });
      }
      if (!hasExamples) {
        issues.push({ severity: 'p2', category: 'clarity', message: 'Add concrete examples' });
      }

      return {
        score: Math.min(95, score),
        issues,
        suggestions: [
          !hasExamples ? 'Include 2-3 real case studies or examples' : '',
          !hasCTA ? 'Add a "Next Steps" section with actionable recommendations' : '',
        ].filter(Boolean) as string[],
      };
    },

    async generateRevision({ current, feedback }: any) {
      return current + `\n\n## Enhanced Based on Feedback\n\n${feedback}\n\nRevised content incorporating additional specific examples and evidence.`;
    }
  };
}

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
