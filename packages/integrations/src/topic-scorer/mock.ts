// Mock Topic Scorer — Deterministic scoring for testing/demo (no API calls)

import { TopicScorerProvider, TopicScoringParams, LLMTopicScoreResult } from './index';

export class MockTopicScorer implements TopicScorerProvider {
  async scoreTopic(params: TopicScoringParams): Promise<LLMTopicScoreResult> {
    const { topic, strategy } = params;

    console.log('[MockTopicScorer] Scoring:', topic.title.substring(0, 50));

    const scores = this.calculateScores(topic, strategy);
    const totalScore = this.calculateWeightedScore(scores);

    return {
      totalScore: Math.round(totalScore),
      confidence: 85,
      breakdown: {
        strategicRelevance: {
          score: scores.strategicRelevance,
          reasoning: this.getReasoningForScore('strategicRelevance', scores.strategicRelevance, topic, strategy),
          suggestions: this.getSuggestionsForScore('strategicRelevance', scores.strategicRelevance),
        },
        audienceIcpUsefulness: {
          score: scores.audienceIcpUsefulness,
          reasoning: this.getReasoningForScore('audienceIcpUsefulness', scores.audienceIcpUsefulness, topic, strategy),
          suggestions: this.getSuggestionsForScore('audienceIcpUsefulness', scores.audienceIcpUsefulness),
        },
        availableEvidenceAndDemand: {
          score: scores.availableEvidenceAndDemand,
          reasoning: this.getReasoningForScore('availableEvidenceAndDemand', scores.availableEvidenceAndDemand, topic, strategy),
          suggestions: this.getSuggestionsForScore('availableEvidenceAndDemand', scores.availableEvidenceAndDemand),
        },
        differentiatedAngle: {
          score: scores.differentiatedAngle,
          reasoning: this.getReasoningForScore('differentiatedAngle', scores.differentiatedAngle, topic, strategy),
          suggestions: this.getSuggestionsForScore('differentiatedAngle', scores.differentiatedAngle),
        },
        smeFit: {
          score: scores.smeFit,
          reasoning: this.getReasoningForScore('smeFit', scores.smeFit, topic, strategy),
          suggestions: this.getSuggestionsForScore('smeFit', scores.smeFit),
        },
        searchContentGap: {
          score: scores.searchContentGap,
          reasoning: this.getReasoningForScore('searchContentGap', scores.searchContentGap, topic, strategy),
          suggestions: this.getSuggestionsForScore('searchContentGap', scores.searchContentGap),
        },
        conversionDistributionPotential: {
          score: scores.conversionDistributionPotential,
          reasoning: this.getReasoningForScore('conversionDistributionPotential', scores.conversionDistributionPotential, topic, strategy),
          suggestions: this.getSuggestionsForScore('conversionDistributionPotential', scores.conversionDistributionPotential),
        },
      },
      overallRecommendation: this.getOverallRecommendation(totalScore),
    };
  }

  private calculateScores(
    topic: TopicScoringParams['topic'],
    strategy: TopicScoringParams['strategy']
  ): Record<string, number> {
    const text = (
      (topic.title || '') +
      ' ' +
      (topic.summary || '') +
      ' ' +
      (topic.angle || '')
    ).toLowerCase();

    let strategicRelevance = 65;
    const offeringMatches = strategy.offerings.filter((o) =>
      text.includes(o.toLowerCase())
    ).length;
    strategicRelevance = 65 + offeringMatches * 15;

    let audienceIcpUsefulness = 65;
    const icpMatches = strategy.targetIcps.filter((icp) =>
      text.includes(icp.toLowerCase())
    ).length;
    audienceIcpUsefulness = 65 + icpMatches * 15;

    let availableEvidenceAndDemand = 65;
    const summaryLength = (topic.summary || '').length;
    const evidenceKeywords = [
      'research',
      'study',
      'data',
      'case',
      'analysis',
      'benchmark',
      'evidence',
    ];
    const evidenceCount = evidenceKeywords.filter((kw) => text.includes(kw)).length;

    if (summaryLength > 200 && evidenceCount >= 3) {
      availableEvidenceAndDemand = 88;
    } else if (summaryLength > 150 && evidenceCount >= 2) {
      availableEvidenceAndDemand = 78;
    } else if (summaryLength > 100 && evidenceCount >= 1) {
      availableEvidenceAndDemand = 70;
    } else if (summaryLength > 50) {
      availableEvidenceAndDemand = 60;
    } else {
      availableEvidenceAndDemand = 50;
    }

    let differentiatedAngle = 65;
    if (topic.angle) {
      const angleLength = topic.angle.length;
      const diffKeywords = ['vs', 'comparison', 'unique', 'proprietary', 'proven'];
      const diffCount = diffKeywords.filter((kw) => text.includes(kw)).length;

      if (angleLength > 100 && diffCount >= 2) {
        differentiatedAngle = 88;
      } else if (angleLength > 80 && diffCount >= 1) {
        differentiatedAngle = 78;
      } else if (angleLength > 50) {
        differentiatedAngle = 70;
      } else {
        differentiatedAngle = 62;
      }
    } else {
      differentiatedAngle = 62;
    }

    let smeFit = 68;
    if (text.includes('technical') || text.includes('engineering')) {
      smeFit = 82;
    } else if (text.includes('strategy') || text.includes('leadership')) {
      smeFit = 80;
    } else if (text.includes('how') || text.includes('guide')) {
      smeFit = 75;
    }

    let searchContentGap = 65;
    const demandKeywords = [
      'how to',
      'guide',
      'tutorial',
      'best practices',
      'comparison',
      'vs',
      'examples',
    ];
    const demandCount = demandKeywords.filter((kw) => text.includes(kw)).length;

    if (demandCount >= 3) {
      searchContentGap = 88;
    } else if (demandCount === 2) {
      searchContentGap = 78;
    } else if (demandCount === 1) {
      searchContentGap = 70;
    } else {
      searchContentGap = 62;
    }

    let conversionDistributionPotential = 65;
    const ctaKeywords = [
      'action',
      'implementation',
      'case study',
      'tools',
      'resources',
      'roi',
      'checklist',
    ];
    const ctaCount = ctaKeywords.filter((kw) => text.includes(kw)).length;

    if ((topic.format === 'case_study' || topic.format === 'comparison') && ctaCount >= 2) {
      conversionDistributionPotential = 88;
    } else if (ctaCount >= 2) {
      conversionDistributionPotential = 78;
    } else if (ctaCount >= 1) {
      conversionDistributionPotential = 70;
    } else if (topic.format) {
      conversionDistributionPotential = 65;
    } else {
      conversionDistributionPotential = 58;
    }

    return {
      strategicRelevance: Math.min(100, strategicRelevance),
      audienceIcpUsefulness: Math.min(100, audienceIcpUsefulness),
      availableEvidenceAndDemand,
      differentiatedAngle,
      smeFit,
      searchContentGap,
      conversionDistributionPotential,
    };
  }

  private calculateWeightedScore(scores: Record<string, number>): number {
    const weights = {
      strategicRelevance: 0.25,
      audienceIcpUsefulness: 0.15,
      availableEvidenceAndDemand: 0.15,
      differentiatedAngle: 0.15,
      smeFit: 0.1,
      searchContentGap: 0.1,
      conversionDistributionPotential: 0.1,
    };

    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
      total += (scores[key] || 0) * weight;
    }

    return total;
  }

  private getReasoningForScore(
    dimension: string,
    score: number,
    _topic: TopicScoringParams['topic'],
    strategy: TopicScoringParams['strategy']
  ): string {
    const reasonings: Record<string, Record<string, string>> = {
      strategicRelevance: {
        high: `Directly mentions your ${strategy.offerings.slice(0, 2).join(' and ')} offerings.`,
        medium: 'Related to your offerings but could be more specific.',
        low: 'Does not align with strategy offerings.',
      },
      audienceIcpUsefulness: {
        high: `Specifically targets your ${strategy.targetIcps.slice(0, 1)[0]} audience segment.`,
        medium: 'Relevant to customer roles but could be more specific.',
        low: 'Generic audience, no specific ICP alignment.',
      },
      availableEvidenceAndDemand: {
        high: 'Strong evidence signals: case studies, data, benchmarks, research.',
        medium: 'Some evidence signals but could include more detail.',
        low: 'Limited evidence or market validation.',
      },
      differentiatedAngle: {
        high: 'Clear differentiation angle (comparison, proprietary approach).',
        medium: 'Some differentiation signals present.',
        low: 'Generic angle without clear differentiation.',
      },
      smeFit: {
        high: 'Perfect fit for internal subject-matter experts.',
        medium: 'Can be covered by available expertise.',
        low: 'Requires expertise company may lack.',
      },
      searchContentGap: {
        high: 'High search demand indicators (how-to, guide, comparison).',
        medium: 'Some search demand signals.',
        low: 'Limited search demand signals.',
      },
      conversionDistributionPotential: {
        high: 'Strong CTA potential and high shareability format.',
        medium: 'Good CTA potential.',
        low: 'Limited conversion and distribution signals.',
      },
    };

    const tier = score >= 80 ? 'high' : score >= 65 ? 'medium' : 'low';
    return reasonings[dimension]?.[tier] || 'Unable to determine reasoning.';
  }

  private getSuggestionsForScore(dimension: string, score: number): string[] {
    if (score >= 80) return [];

    const suggestions: Record<string, string[]> = {
      strategicRelevance: [
        'Mention specific product offerings by name',
        'Add clear business value proposition',
      ],
      audienceIcpUsefulness: [
        'Target specific customer role/company stage',
        'Address their unique pain points',
      ],
      availableEvidenceAndDemand: [
        'Include case studies or real examples',
        'Add research data or benchmarks',
      ],
      differentiatedAngle: [
        'Add comparison to competitors',
        'Highlight proprietary or unique approach',
      ],
      smeFit: [
        'Clarify the expertise type needed',
        'Ensure topic matches your team skills',
      ],
      searchContentGap: [
        'Use high-demand keywords (how-to, guide, vs)',
        'Add tutorial or comparison elements',
      ],
      conversionDistributionPotential: [
        'Add implementation or ROI focus',
        'Include shareable format (case study, checklist)',
      ],
    };

    return suggestions[dimension]?.slice(0, 3) || [];
  }

  private getOverallRecommendation(score: number): string {
    if (score >= 85) {
      return 'Queue immediately - Excellent strategic fit and high quality.';
    } else if (score >= 75) {
      return 'Good topic - Queue soon, could refine slightly.';
    } else if (score >= 65) {
      return 'Fair topic - Needs improvement before queuing.';
    } else if (score >= 50) {
      return 'Weak alignment - Revise to better match strategy.';
    } else {
      return 'Not recommended - Significant mismatch with strategy.';
    }
  }
}
