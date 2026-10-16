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

export { AnthropicTopicScorer } from './anthropic';
export { OpenAITopicScorer } from './openai';
export { MockTopicScorer } from './mock';
