// Article service — orchestrates draft generation workflow
// Simplified for marketing demo (full state machine comes later)

import { TextModelProvider } from '@blog-agent/integrations';

export interface ArticleBrief {
  title: string;
  topic: string;
  brief: string;
  outline: string;
  voiceProfile?: string;
  targetLength?: number;
}

export interface GeneratedDraft {
  content: string;
  wordCount: number;
  generatedAt: Date;
}

export interface DraftCritique {
  score: number;
  issues: Array<{
    severity: 'p0' | 'p1' | 'p2' | 'p3';
    category: string;
    message: string;
  }>;
  suggestions: string[];
  evaluatedAt: Date;
}

export class ArticleService {
  constructor(private textModel: TextModelProvider) {}

  async generateDraft(brief: ArticleBrief): Promise<GeneratedDraft> {
    console.log(`[ArticleService] Generating draft for: ${brief.title}`);

    const draft = await this.textModel.generateDraft({
      title: brief.title,
      brief: brief.brief,
      outline: brief.outline,
      voiceProfile: brief.voiceProfile,
      targetLength: brief.targetLength,
    });

    const wordCount = draft.split(/\s+/).length;

    return {
      content: draft,
      wordCount,
      generatedAt: new Date(),
    };
  }

  async critiqueDraft(content: string, voiceProfile?: string): Promise<DraftCritique> {
    console.log('[ArticleService] Critiquing draft...');
    void voiceProfile; // unused in current implementation

    const critique = await this.textModel.generateCritique({
      current: content,
    });

    return {
      ...critique,
      evaluatedAt: new Date(),
    };
  }

  async reviseDraft(
    currentDraft: string,
    feedback: string,
    previousFeedback?: string[]
  ): Promise<GeneratedDraft> {
    console.log('[ArticleService] Revising draft based on feedback...');

    const revised = await this.textModel.generateRevision({
      current: currentDraft,
      feedback,
      previousFeedback,
    });

    const wordCount = revised.split(/\s+/).length;

    return {
      content: revised,
      wordCount,
      generatedAt: new Date(),
    };
  }

  // Calculate publish-readiness score (simplified for MVP)
  calculateReadinessScore(content: string, critique?: DraftCritique): number {
    if (critique) {
      return critique.score; // Use TextModel's score for now
    }

    // Fallback: basic heuristics
    let score = 50;
    const wordCount = content.split(/\s+/).length;
    const hasHeadings = /^#{1,3} /m.test(content);
    const hasExamples = /example|case|demonstrate/i.test(content);
    const hasCTA = /next step|action|recommend|contact/i.test(content);

    if (wordCount > 1500) score += 10;
    if (wordCount > 2500) score += 10;
    if (hasHeadings) score += 10;
    if (hasExamples) score += 10;
    if (hasCTA) score += 10;

    return Math.min(100, score);
  }
}
