// Shared in-memory store for topics (accessible across all API routes)
// globalThis-backed to survive Next.js dev hot-reloads (like articleStore)

import { scoreTopicCandidate, Strategy, TopicCandidate } from '@blog-agent/domain';

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

declare global {
  var _topicStore: Map<string, TopicCandidateWithScore[]> | undefined;
}

if (!globalThis._topicStore) {
  globalThis._topicStore = new Map<string, TopicCandidateWithScore[]>();
}

export const topicStore = globalThis._topicStore;

const VALID_FORMATS = new Set(['blog', 'guide', 'case_study', 'whitepaper']);

export function generateTopicId(): string {
  return `topic_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export function scoreAndBuildTopic(topicInput: TopicCandidate, strategy: Strategy): TopicCandidateWithScore {
  const result = scoreTopicCandidate(topicInput, strategy);
  return {
    id: generateTopicId(),
    title: topicInput.title,
    summary: topicInput.summary || '',
    format: VALID_FORMATS.has(topicInput.format || '') ? (topicInput.format as string) : 'blog',
    angle: topicInput.angle,
    targetOffering: topicInput.targetOffering,
    geography: topicInput.geography,
    audience: topicInput.audience,
    score: result.score,
    confidence: result.confidence,
    breakdown: result.breakdown,
    cannibalizationRisk: result.cannibalizationRisk,
    recommendedSmes: result.recommendedSmes,
    missingInputs: result.missingInputs,
    createdAt: new Date().toISOString(),
  };
}

export function persistTopic(strategyId: string, topic: TopicCandidateWithScore): TopicCandidateWithScore[] {
  const existing = topicStore.get(strategyId) || [];
  const updated = [topic, ...existing].sort((a, b) => b.score - a.score);
  topicStore.set(strategyId, updated);
  return updated;
}
