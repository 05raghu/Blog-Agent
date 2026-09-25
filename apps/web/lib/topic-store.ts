// Shared in-memory store for topics (accessible across all API routes)

export interface TopicCandidateWithScore {
  id: string;
  title: string;
  summary: string;
  format: string;
  angle?: string;
  targetOffering?: string;
  geography?: string;
  audience?: string;
  score: number;
  confidence: number;
  breakdown: {
    strategicRelevance: { score: number; evidence: string };
    audienceIcpUsefulness: { score: number; evidence: string };
    availableEvidenceAndDemand: { score: number; evidence: string };
    differentiatedAngle: { score: number; evidence: string };
    smeFit: { score: number; evidence: string };
    searchContentGap: { score: number; evidence: string };
    conversionDistributionPotential: { score: number; evidence: string };
  };
  cannibalizationRisk: { exists: boolean; message?: string };
  recommendedSmes: Array<{ name: string; fitScore: number; reason: string }>;
  missingInputs: string[];
  createdAt: string;
  updatedAt?: string;
}

// Global shared store: strategyId → topics
export const topicStore = new Map<string, TopicCandidateWithScore[]>();
