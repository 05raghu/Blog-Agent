// Topic scoring rubric — evaluate candidate topics against strategy (PRD P0.1)
// PRD Rubric: Strategic relevance 25%, Audience/ICP usefulness 15%, Available evidence 15%,
// Differentiated angle 15%, SME fit 10%, Search/content gap 10%, Conversion/distribution 10%

export interface TopicScoreBreakdown {
  strategicRelevance: { score: number; evidence: string };
  audienceIcpUsefulness: { score: number; evidence: string };
  availableEvidenceAndDemand: { score: number; evidence: string };
  differentiatedAngle: { score: number; evidence: string };
  smeFit: { score: number; evidence: string };
  searchContentGap: { score: number; evidence: string };
  conversionDistributionPotential: { score: number; evidence: string };
}

export interface TopicScoreResult {
  score: number; // 0-100 final score
  confidence: number; // 0-100 confidence based on missing inputs
  breakdown: TopicScoreBreakdown;
  cannibalizationRisk: {
    exists: boolean;
    message?: string;
  };
  recommendedSmes: Array<{
    name: string;
    fitScore: number;
    reason: string;
  }>;
  missingInputs: string[];
}

export interface Strategy {
  offerings: string[];
  targetIcps: string[];
  geographies: string[];
  competitors: string[];
  contentMix: Record<string, number>;
}

export interface TopicCandidate {
  title: string;
  summary?: string;
  angle?: string;
  targetOffering?: string;
  format?: string;
  geography?: string;
  audience?: string;
}

// PRD Fixed Weights (Non-negotiable)
const PRD_WEIGHTS = {
  strategicRelevance: 25,
  audienceIcpUsefulness: 15,
  availableEvidenceAndDemand: 15,
  differentiatedAngle: 15,
  smeFit: 10,
  searchContentGap: 10,
  conversionDistributionPotential: 10,
};

export function scoreTopicCandidate(topic: TopicCandidate, strategy: Strategy): TopicScoreResult {
  const missingInputs: string[] = [];

  // Score each dimension
  const strategicRelevance = scoreStrategicRelevance(topic, strategy, missingInputs);
  const audienceIcpUsefulness = scoreAudienceIcpUsefulness(topic, strategy, missingInputs);
  const availableEvidenceAndDemand = scoreAvailableEvidence(topic, strategy, missingInputs);
  const differentiatedAngle = scoreDifferentiatedAngle(topic, strategy, missingInputs);
  const smeFit = scoreSmeFit(topic, strategy, missingInputs);
  const searchContentGap = scoreSearchContentGap(topic, missingInputs);
  const conversionDistributionPotential = scoreConversionPotential(topic, missingInputs);

  const breakdown: TopicScoreBreakdown = {
    strategicRelevance,
    audienceIcpUsefulness,
    availableEvidenceAndDemand,
    differentiatedAngle,
    smeFit,
    searchContentGap,
    conversionDistributionPotential,
  };

  // Calculate weighted score using PRD weights
  const score = Math.round(
    (strategicRelevance.score * PRD_WEIGHTS.strategicRelevance +
      audienceIcpUsefulness.score * PRD_WEIGHTS.audienceIcpUsefulness +
      availableEvidenceAndDemand.score * PRD_WEIGHTS.availableEvidenceAndDemand +
      differentiatedAngle.score * PRD_WEIGHTS.differentiatedAngle +
      smeFit.score * PRD_WEIGHTS.smeFit +
      searchContentGap.score * PRD_WEIGHTS.searchContentGap +
      conversionDistributionPotential.score * PRD_WEIGHTS.conversionDistributionPotential) /
      100
  );

  // Calculate confidence: missing inputs lower confidence
  const maxInputs = 7; // All input categories
  const confidence = Math.round(((maxInputs - missingInputs.length) / maxInputs) * 100);

  // Detect cannibalization
  const cannibalizationRisk = detectCannibalization(topic, strategy);

  // Get SME recommendations
  const recommendedSmes = getSmERecommendations(topic, strategy, smeFit.score);

  return {
    score: Math.min(100, Math.max(0, score)),
    confidence,
    breakdown,
    cannibalizationRisk,
    recommendedSmes,
    missingInputs,
  };
}

function scoreStrategicRelevance(
  topic: TopicCandidate,
  strategy: Strategy,
  missingInputs: string[]
): { score: number; evidence: string } {
  // Does this align with strategy objectives and offerings?
  const text = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
  let score = 50; // Base score
  let evidence = '';

  // If no offerings defined in strategy, can't assess - return neutral score
  if (!strategy.offerings || strategy.offerings.length === 0) {
    evidence = 'No offerings defined in strategy to assess relevance';
    return { score: 50, evidence };
  }

  let matchCount = 0;
  for (const offering of strategy.offerings) {
    if (text.includes(offering.toLowerCase())) {
      matchCount++;
      evidence += `✓ Mentions "${offering}" `;
    }
  }

  if (matchCount > 0) {
    score = 60 + matchCount * 10;
    evidence = evidence.trim();
  } else {
    evidence = 'Does not mention strategy offerings';
    score = 40;
  }

  return { score: Math.min(100, score), evidence };
}

function scoreAudienceIcpUsefulness(
  topic: TopicCandidate,
  strategy: Strategy,
  missingInputs: string[]
): { score: number; evidence: string } {
  // Does this solve problems for target ICPs?
  const text = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
  let score = 50;
  let evidence = '';

  // If no ICPs defined in strategy, can't assess - return neutral score
  if (!strategy.targetIcps || strategy.targetIcps.length === 0) {
    evidence = 'No target ICPs defined in strategy to assess usefulness';
    return { score: 50, evidence };
  }

  let matches = 0;
  for (const icp of strategy.targetIcps) {
    if (text.includes(icp.toLowerCase())) {
      matches++;
      evidence += `✓ Targets "${icp}" `;
    }
  }

  if (matches > 0) {
    score = 60 + (matches / strategy.targetIcps.length) * 40;
    evidence = evidence.trim();
  } else {
    evidence = 'Does not mention target ICPs';
    score = 40;
  }

  return { score: Math.min(100, score), evidence };
}

function scoreAvailableEvidence(
  topic: TopicCandidate,
  strategy: Strategy,
  missingInputs: string[]
): { score: number; evidence: string } {
  // Is there demand and evidence available?
  let score = 50;
  let evidence = '';

  if (!topic.summary || topic.summary.length === 0) {
    missingInputs.push('Topic summary');
    return { score: 40, evidence: 'No summary provided' };
  }

  if (topic.summary.length < 50) {
    evidence = 'Limited summary detail';
    score = 45;
  } else {
    const text = topic.summary.toLowerCase();
    const evidenceKeywords = ['research', 'study', 'data', 'report', 'case', 'analysis', 'evidence'];
    let evidenceCount = 0;

    for (const kw of evidenceKeywords) {
      if (text.includes(kw)) {
        evidenceCount++;
      }
    }

    if (evidenceCount > 0) {
      score = 60 + evidenceCount * 5;
      evidence = `Indicates ${evidenceCount} evidence sources`;
    } else {
      evidence = 'Limited evidence signals in summary';
      score = 50;
    }
  }

  return { score: Math.min(100, score), evidence };
}

function scoreDifferentiatedAngle(
  topic: TopicCandidate,
  strategy: Strategy,
  missingInputs: string[]
): { score: number; evidence: string } {
  // Is this differentiated vs. competitors?
  let score = 50;
  let evidence = '';

  if (!topic.angle) {
    missingInputs.push('Topic angle');
    return { score: 45, evidence: 'No specific angle provided' };
  }

  const text = (topic.title + ' ' + topic.angle).toLowerCase();
  const uniqueKeywords = ['unique', 'vs', 'comparison', 'alternative', 'better', 'only', 'proprietary'];
  let uniqueCount = 0;

  for (const kw of uniqueKeywords) {
    if (text.includes(kw)) {
      uniqueCount++;
    }
  }

  if (uniqueCount > 0) {
    score = 65 + uniqueCount * 5;
    evidence = `Differentiating factors found: ${uniqueCount}`;
  } else {
    evidence = 'Angle provided but limited differentiation signals';
    score = 55;
  }

  return { score: Math.min(100, score), evidence };
}

function scoreSmeFit(
  topic: TopicCandidate,
  strategy: Strategy,
  missingInputs: string[]
): { score: number; evidence: string } {
  // Which SME would be best for this?
  let score = 50;
  let evidence = '';

  if (!topic.targetOffering) {
    missingInputs.push('Target offering');
    evidence = 'Target offering not specified';
    score = 45;
  } else {
    const text = (topic.title + ' ' + (topic.summary || '')).toLowerCase();

    if (text.includes('technical') || text.includes('engineering')) {
      evidence = 'Technical/engineering expertise likely needed';
      score = 70;
    } else if (text.includes('strategy') || text.includes('leadership')) {
      evidence = 'Leadership/strategy expertise likely needed';
      score = 70;
    } else {
      evidence = `Subject-matter expert for "${topic.targetOffering}" needed`;
      score = 60;
    }
  }

  return { score, evidence };
}

function scoreSearchContentGap(
  topic: TopicCandidate,
  missingInputs: string[]
): { score: number; evidence: string } {
  // Is there search demand and content gap?
  const text = topic.title.toLowerCase();
  let score = 50;
  let evidence = '';

  const demandKeywords = ['how to', 'guide', 'tutorial', 'best practices', 'examples', 'vs', 'comparison'];
  let demandCount = 0;

  for (const kw of demandKeywords) {
    if (text.includes(kw)) {
      demandCount++;
    }
  }

  if (demandCount > 0) {
    score = 60 + demandCount * 5;
    evidence = `High-demand topic indicators: ${demandCount}`;
  } else {
    evidence = 'Limited search demand signals';
  }

  return { score: Math.min(100, score), evidence };
}

function scoreConversionPotential(
  topic: TopicCandidate,
  missingInputs: string[]
): { score: number; evidence: string } {
  // Does this have CTA and conversion potential?
  const text = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
  let score = 50;
  let evidence = '';

  const ctaKeywords = ['action', 'implementation', 'start', 'try', 'tools', 'resources', 'case study'];
  let ctaCount = 0;

  for (const kw of ctaKeywords) {
    if (text.includes(kw)) {
      ctaCount++;
    }
  }

  if (ctaCount > 0) {
    score = 60 + ctaCount * 4;
    evidence = `CTA potential signals: ${ctaCount}`;
  } else {
    evidence = 'Limited CTA signals';
  }

  return { score: Math.min(100, score), evidence };
}

function detectCannibalization(
  topic: TopicCandidate,
  strategy: Strategy
): { exists: boolean; message?: string } {
  // Simple detection: same topic in different formats
  // In production, this would check against published articles
  const topicWords = topic.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  if (topicWords.length > 0) {
    // Placeholder: would compare against published articles in real implementation
    return {
      exists: false,
      message: 'No cannibalization detected',
    };
  }

  return { exists: false };
}

function getSmERecommendations(
  topic: TopicCandidate,
  strategy: Strategy,
  smeFitScore: number
): Array<{ name: string; fitScore: number; reason: string }> {
  // In production, this would recommend from actual SME profiles
  // For now, return placeholder recommendations based on topic analysis
  const recommendations: Array<{ name: string; fitScore: number; reason: string }> = [];

  if (topic.targetOffering) {
    recommendations.push({
      name: `SME with ${topic.targetOffering} expertise`,
      fitScore: smeFitScore,
      reason: `Strong expertise in ${topic.targetOffering}`,
    });
  }

  return recommendations.slice(0, 3); // Max 3 recommendations
}

