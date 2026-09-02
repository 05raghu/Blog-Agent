// API route: POST /api/drafts/critique — Critique a draft

import { NextRequest, NextResponse } from 'next/server';
import { ArticleService } from '@blog-agent/domain';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Missing draft content' }, { status: 400 });
    }

    // Simple inline provider for MVP
    const mockProvider = {
      async generateCritique() {
        const wordCount = content.split(/\s+/).length;
        const hasExamples = /example|case|demonstrate|instance/i.test(content);
        const hasData = /data|research|found|study|show/i.test(content);
        const hasCTA = /next step|action|contact|learn more|try/i.test(content);

        let score = 50;
        if (wordCount > 1500) score += 15;
        if (hasExamples) score += 15;
        if (hasData) score += 15;
        if (hasCTA) score += 5;

        const issues: Array<{severity: 'p0'|'p1'|'p2'|'p3'; category: 'evidence'|'clarity'|'brand'|'engagement'; message: string}> = [];
        if (!hasData) {
          issues.push({ severity: 'p1', category: 'evidence', message: 'Add more data-backed claims' });
        }
        if (!hasExamples) {
          issues.push({ severity: 'p2', category: 'clarity', message: 'Add concrete examples' });
        }

        return {
          score: Math.min(95, score),
          issues,
          suggestions: [
            !hasExamples ? 'Add 2-3 concrete examples or case studies' : '',
            !hasCTA ? 'Include a "Next Steps" section' : '',
          ].filter(Boolean) as string[],
        };
      },
      async generateDraft() { return ''; },
      async generateRevision() { return ''; },
    };

    const articleService = new ArticleService(mockProvider as any);

    console.log('[API] Critiquing draft...');
    const critique = await articleService.critiqueDraft(content);

    return NextResponse.json({
      score: critique.score,
      issues: critique.issues,
      suggestions: critique.suggestions,
      evaluatedAt: critique.evaluatedAt,
    });
  } catch (error) {
    console.error('[API] Critique error:', error);
    return NextResponse.json(
      { error: 'Failed to critique draft', message: (error as Error).message },
      { status: 500 }
    );
  }
}
