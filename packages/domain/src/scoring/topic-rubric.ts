// Topic scoring rubric — evaluate candidate topics against strategy

export interface TopicScoreResult {
  score: number; // 0-100
  breakdown: {
    icpFit: number;
    competitiveMoat: number;
    contentMixAlignment: number;
    offeringRelevance: number;
    volumePotential: number;
  };
}

export interface Strategy {
  offerings: string[];
  targetIcps: string[];
  geographies: string[];
  competitors: string[];
  contentMix: Record<string, number>; // { "how-to": 30, "thought-leadership": 40, ... }
  rubricWeights?: {
    icpFit: number;
    competitiveMoat: number;
    contentMixAlignment: number;
    offeringRelevance: number;
    volumePotential: number;
  };
}

export interface TopicCandidate {
  title: string;
  summary?: string;
  angle?: string;
  targetOffering?: string;
  format?: string; // blog, guide, case_study, whitepaper
}

const DEFAULT_WEIGHTS = {
  icpFit: 20,
  competitiveMoat: 20,
  contentMixAlignment: 20,
  offeringRelevance: 20,
  volumePotential: 20,
};

export function scoreTopicCandidate(topic: TopicCandidate, strategy: Strategy): TopicScoreResult {
  const weights = strategy.rubricWeights || DEFAULT_WEIGHTS;

  // ICP Fit (20%) — Does this solve a problem for our ICPs?
  const icpFit = scoreIcpFit(topic, strategy);

  // Competitive Moat (20%) — Does this differentiate vs. competitors?
  const competitiveMoat = scoreCompetitiveMoat(topic, strategy);

  // Content Mix Alignment (20%) — Matches our planned content distribution?
  const contentMixAlignment = scoreContentMixAlignment(topic, strategy);

  // Offering Relevance (20%) — Connects to at least one offering?
  const offeringRelevance = scoreOfferingRelevance(topic, strategy);

  // Volume Potential (20%) — Realistic search/engagement opportunity?
  const volumePotential = scoreVolumePotential(topic);

  const breakdown = {
    icpFit,
    competitiveMoat,
    contentMixAlignment,
    offeringRelevance,
    volumePotential,
  };

  // Calculate weighted score
  const score = Math.round(
    (icpFit * weights.icpFit +
      competitiveMoat * weights.competitiveMoat +
      contentMixAlignment * weights.contentMixAlignment +
      offeringRelevance * weights.offeringRelevance +
      volumePotential * weights.volumePotential) /
      100
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown,
  };
}

function scoreIcpFit(topic: TopicCandidate, strategy: Strategy): number {
  if (!strategy.targetIcps || strategy.targetIcps.length === 0) return 50;

  const title = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
  const summary = topic.summary?.toLowerCase() || '';

  let matches = 0;
  const keywords = ['engineering', 'manager', 'leader', 'team', 'enterprise', 'startup', 'sme', 'decision'];

  for (const icp of strategy.targetIcps) {
    if (title.includes(icp.toLowerCase()) || summary.includes(icp.toLowerCase())) {
      matches++;
    }
  }

  for (const kw of keywords) {
    if (title.includes(kw) || summary.includes(kw)) {
      matches += 0.5;
    }
  }

  return Math.min(100, (matches / Math.max(1, strategy.targetIcps.length)) * 100);
}

function scoreCompetitiveMoat(topic: TopicCandidate, strategy: Strategy): number {
  if (!strategy.competitors || strategy.competitors.length === 0) return 60;

  const title = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
  const uniqueKeywords = ['alternative', 'vs', 'comparison', 'better', 'unique', 'own', 'proprietary', 'only'];

  let uniquenessScore = 60; // Base score

  for (const keyword of uniqueKeywords) {
    if (title.includes(keyword)) {
      uniquenessScore = Math.min(100, uniquenessScore + 10);
    }
  }

  return uniquenessScore;
}

function scoreContentMixAlignment(topic: TopicCandidate, strategy: Strategy): number {
  if (!strategy.contentMix || Object.keys(strategy.contentMix).length === 0) return 60;

  const format = (topic.format || 'blog').toLowerCase();
  const title = topic.title.toLowerCase();

  let alignment = 50;

  // Map format to content type
  if (format.includes('guide') || title.includes('guide') || title.includes('how-to') || title.includes('how to')) {
    alignment = Math.min(100, alignment + (strategy.contentMix['how-to'] || strategy.contentMix['guide'] || 0) / 2);
  } else if (
    format.includes('case') ||
    format.includes('study') ||
    title.includes('case study') ||
    title.includes('success')
  ) {
    alignment = Math.min(100, alignment + (strategy.contentMix['case-study'] || strategy.contentMix['case'] || 0) / 2);
  } else if (format.includes('white') || format.includes('paper') || title.includes('whitepaper')) {
    alignment = Math.min(100, alignment + (strategy.contentMix['whitepaper'] || 0) / 2);
  } else {
    alignment = Math.min(100, alignment + (strategy.contentMix['thought-leadership'] || strategy.contentMix['blog'] || 0) / 2);
  }

  return alignment;
}

function scoreOfferingRelevance(topic: TopicCandidate, strategy: Strategy): number {
  if (!strategy.offerings || strategy.offerings.length === 0) return 50;

  const title = (topic.title + ' ' + (topic.summary || '') + ' ' + (topic.targetOffering || '')).toLowerCase();

  let matches = 0;
  for (const offering of strategy.offerings) {
    if (title.includes(offering.toLowerCase())) {
      matches++;
    }
  }

  return Math.min(100, (matches / Math.max(1, strategy.offerings.length)) * 100);
}

function scoreVolumePotential(topic: TopicCandidate): number {
  // Simple heuristic: topics with specific keywords have higher volume potential
  const title = topic.title.toLowerCase();
  const volumeKeywords = ['how to', 'guide', 'best practices', 'tutorial', 'examples', 'vs', 'comparison'];

  let score = 50;
  for (const kw of volumeKeywords) {
    if (title.includes(kw)) {
      score = Math.min(100, score + 15);
    }
  }

  return score;
}
