// Topic Scorer Interface — LLM-based evaluation of topics against strategy

export interface TopicScoringParams {
  topic: {
    title: string;
    summary?: string;
    angle?: string;
    targetOffering?: string;
    format?: string;
    geography?: string;
    audience?: string;
  };
  strategy: {
    offerings: string[];
    targetIcps: string[];
    geographies: string[];
    competitors: string[];
    contentMix: Record<string, number>;
  };
  searchDemand?: {
    estimatedMonthlySearches: number;
    demandLevel: 'high' | 'medium' | 'low';
    resultCount: number;
    trending: boolean;
    confidence: number;
  };
  trendEvidence?: {
    linkedinPostCount: number;
    recentArticleCount: number;
    webArticleCount: number;
    topSources: string[];
    isTrending: boolean;
    reasoning: string;
  };
}

export interface DimensionScore {
  score: number;
  reasoning: string;
  suggestions?: string[];
}

export interface LLMTopicScoreResult {
  totalScore: number;
  confidence: number;
  breakdown: {
    strategicRelevance: DimensionScore;
    audienceIcpUsefulness: DimensionScore;
    availableEvidenceAndDemand: DimensionScore;
    differentiatedAngle: DimensionScore;
    smeFit: DimensionScore;
    searchContentGap: DimensionScore;
    conversionDistributionPotential: DimensionScore;
  };
  overallRecommendation: string;
  cannibalizationWarning?: string;
}

export interface TopicScorerProvider {
  scoreTopic(params: TopicScoringParams): Promise<LLMTopicScoreResult>;
}

// Fixed V1 opportunity rubric weights (see BLOG_AGENT_PRD.md §7 P0.1).
// totalScore must always be computed from these — never trusted as a
// free-text number from the LLM, since LLMs do not reliably self-compute
// a weighted average consistent with the weights they were given.
export const DIMENSION_WEIGHTS: Record<keyof LLMTopicScoreResult['breakdown'], number> = {
  strategicRelevance: 0.25,
  audienceIcpUsefulness: 0.15,
  availableEvidenceAndDemand: 0.15,
  differentiatedAngle: 0.15,
  smeFit: 0.10,
  searchContentGap: 0.10,
  conversionDistributionPotential: 0.10,
};

export function computeWeightedScore(breakdown: LLMTopicScoreResult['breakdown']): number {
  let total = 0;
  for (const key of Object.keys(DIMENSION_WEIGHTS) as Array<keyof typeof DIMENSION_WEIGHTS>) {
    const dimension = breakdown[key];
    const score = typeof dimension?.score === 'number' ? dimension.score : 0;
    total += score * DIMENSION_WEIGHTS[key];
  }
  return Math.round(total);
}

export { AnthropicTopicScorer } from './anthropic';
export { OpenAITopicScorer } from './openai';
export { MockTopicScorer } from './mock';
