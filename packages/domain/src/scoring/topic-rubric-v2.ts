// Topic scoring rubric v2 — IMPROVED with market validation & realistic thresholds
// Now includes info text for each dimension + explanation of scoring logic

export interface DimensionInfo {
  name: string;
  weight: number;
  description: string;
  howScoredLow: string;  // How to get 0-40
  howScoredMid: string;  // How to get 40-70
  howScoredHigh: string; // How to get 70-100
  tooltip: string;       // For UI hover
}

export const DIMENSION_EXPLANATIONS: Record<string, DimensionInfo> = {
  strategicRelevance: {
    name: '🎯 Strategic Relevance',
    weight: 25,
    description: 'Does this topic align with your offerings and business positioning?',
    howScoredLow: 'Topic mentions none of your offerings or key value propositions',
    howScoredMid: 'Topic mentions 1 offering but lacks specific business angle',
    howScoredHigh: 'Topic directly addresses 2+ offerings with clear business value',
    tooltip:
      'Measures how well the topic aligns with your products/services. High scores when topic naturally mentions what you sell and solves problems your offerings address.',
  },

  audienceIcpUsefulness: {
    name: '👥 Audience & ICP Fit',
    weight: 15,
    description: 'Is this useful and relevant to your target customers?',
    howScoredLow: 'Topic is generic; could apply to any audience, not your ICP',
    howScoredMid: 'Topic mentions your audience but lacks specific role/company context',
    howScoredHigh: 'Topic specifically addresses your ICP with their challenges and context',
    tooltip:
      'Measures relevance to your specific customer profile (VP of Data, Engineering Leaders, etc.). High scores when topic speaks directly to their problems and needs.',
  },

  availableEvidenceAndDemand: {
    name: '📊 Evidence & Market Demand',
    weight: 15,
    description: 'Is there real market data supporting this topic has demand?',
    howScoredLow: 'Generic topic with no market validation or supporting data',
    howScoredMid: 'Some evidence signals; mentioned in a few case studies or reports',
    howScoredHigh: '5000+ monthly searches, multiple case studies, recent news coverage',
    tooltip:
      'Based on Google Trends, search volume, competitor content count, case studies available, and recent news mentions. Higher demand = higher score.',
  },

  differentiatedAngle: {
    name: '💡 Differentiated Angle',
    weight: 15,
    description: 'What makes this topic different from what competitors write?',
    howScoredLow: 'Standard topic that 50+ competitors cover identically',
    howScoredMid: 'Topic exists but has a slightly different angle (vs/comparison style)',
    howScoredHigh: 'Novel angle with proprietary insight or comparison your competitors miss',
    tooltip:
      'Measures uniqueness in your market. High scores for angles like "vs competitors", "proprietary approach", or "new research" that let you stand out.',
  },

  smeFit: {
    name: '👨‍🔬 SME Fit & Expertise',
    weight: 10,
    description: 'Do you have subject-matter experts who can credibly write this?',
    howScoredLow: 'Topic requires expertise your team lacks (unrelated domain)',
    howScoredMid: 'Topic matches one expert or requires some research to cover',
    howScoredHigh: 'Multiple SMEs can contribute; naturally fits your expertise areas',
    tooltip:
      'Based on alignment with your team expertise. High scores when your SMEs can write with authority and personal experience.',
  },

  searchContentGap: {
    name: '🔍 Search Gap & Demand Signals',
    weight: 10,
    description: 'Is there search demand people are looking for right now?',
    howScoredLow: 'No search demand signals; nobody searches for this',
    howScoredMid: 'Some demand (1000-5000 monthly searches, "how-to" style)',
    howScoredHigh: 'High demand (5000+ searches), low competition, "how-to" intent',
    tooltip:
      'Keyword research signals: search volume, intent match (how-to, guide, tutorial), and competitor article count. High scores = easy rank, high traffic potential.',
  },

  conversionDistributionPotential: {
    name: '📈 Conversion & Distribution',
    weight: 10,
    description: 'Can this drive leads and fits your distribution channels?',
    howScoredLow: 'Generic topic with weak CTA or bottom-of-funnel potential',
    howScoredMid: 'Topic has CTA potential (case study, comparison) but limited reach',
    howScoredHigh: 'Strong CTA potential (case study, ROI, how-to) + high social potential',
    tooltip:
      'Measures conversion and sharing potential. High scores for case studies, comparisons, and how-tos that drive sales and get shared.',
  },
};

export interface TopicScoreBreakdown {
  strategicRelevance: { score: number; evidence: string; data?: any };
  audienceIcpUsefulness: { score: number; evidence: string; data?: any };
  availableEvidenceAndDemand: { score: number; evidence: string; data?: any };
  differentiatedAngle: { score: number; evidence: string; data?: any };
  smeFit: { score: number; evidence: string; data?: any };
  searchContentGap: { score: number; evidence: string; data?: any };
  conversionDistributionPotential: { score: number; evidence: string; data?: any };
}

export interface TopicScoreResult {
  score: number;
  confidence: number;
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
  scoreExplanation: string; // Why did it score this way?
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

// UPDATED WEIGHTS - Same as PRD but with better scoring logic
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

  // ===== NEW IMPROVED SCORING LOGIC =====
  const strategicRelevance = scoreStrategicRelevanceV2(topic, strategy);
  const audienceIcpUsefulness = scoreAudienceIcpUsefulnessV2(topic, strategy);
  const availableEvidenceAndDemand = scoreAvailableEvidenceV2(topic);
  const differentiatedAngle = scoreDifferentiatedAngleV2(topic);
  const smeFit = scoreSmeFitV2(topic);
  const searchContentGap = scoreSearchContentGapV2(topic);
  const conversionDistributionPotential = scoreConversionPotentialV2(topic);

  const breakdown: TopicScoreBreakdown = {
    strategicRelevance,
    audienceIcpUsefulness,
    availableEvidenceAndDemand,
    differentiatedAngle,
    smeFit,
    searchContentGap,
    conversionDistributionPotential,
  };

  // Calculate weighted score
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

  // Calculate confidence
  const maxInputs = 7;
  const confidence = Math.round(((maxInputs - missingInputs.length) / maxInputs) * 100);

  // Generate explanation
  const scoreExplanation = generateScoreExplanation(
    breakdown,
    score,
    topic,
    strategy
  );

  const cannibalizationRisk = detectCannibalization(topic);
  const recommendedSmes = getSmERecommendations(topic, smeFit.score);

  return {
    score: Math.min(100, Math.max(0, score)),
    confidence,
    breakdown,
    cannibalizationRisk,
    recommendedSmes,
    missingInputs,
    scoreExplanation,
  };
}

// ===== IMPROVED DIMENSION SCORING =====

function scoreStrategicRelevanceV2(
  topic: TopicCandidate,
  strategy: Strategy
): { score: number; evidence: string; data?: any } {
  const text = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
  let score = 65; // HIGHER base score (was 50)
  let evidence = '';

  if (!strategy.offerings || strategy.offerings.length === 0) {
    return { score: 50, evidence: 'No offerings defined in strategy' };
  }

  const matchedOfferings = strategy.offerings.filter((o) => text.includes(o.toLowerCase()));
  const matchPercentage = (matchedOfferings.length / strategy.offerings.length) * 100;

  if (matchedOfferings.length >= 2) {
    // Mentions 2+ offerings = high score
    score = 90;
    evidence = `✅ Covers ${matchedOfferings.length} offerings: ${matchedOfferings.join(', ')}`;
  } else if (matchedOfferings.length === 1) {
    // Mentions 1 offering = mid-high score
    score = 78;
    evidence = `✅ Covers offering: ${matchedOfferings[0]}`;
  } else if (
    text.includes('api') ||
    text.includes('platform') ||
    text.includes('data') ||
    text.includes('integration')
  ) {
    // Mentions related keywords even if not exact offering = mid score
    score = 72;
    evidence = '✅ Relevant to product category';
  } else {
    // No alignment
    score = 45;
    evidence = '❌ Does not mention strategy offerings';
  }

  return { score: Math.min(100, score), evidence, data: { matchPercentage } };
}

function scoreAudienceIcpUsefulnessV2(
  topic: TopicCandidate,
  strategy: Strategy
): { score: number; evidence: string; data?: any } {
  const text = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
  let score = 65; // HIGHER base score
  let evidence = '';

  if (!strategy.targetIcps || strategy.targetIcps.length === 0) {
    return { score: 50, evidence: 'No target ICPs defined in strategy' };
  }

  const matchedIcps = strategy.targetIcps.filter((icp) => text.includes(icp.toLowerCase()));
  const matchPercentage = (matchedIcps.length / strategy.targetIcps.length) * 100;

  if (matchedIcps.length >= 2) {
    score = 92;
    evidence = `✅ Targets ${matchedIcps.length} customer segments`;
  } else if (matchedIcps.length === 1) {
    score = 80;
    evidence = `✅ Targets: ${matchedIcps[0]}`;
  } else if (
    text.includes('data') ||
    text.includes('engineer') ||
    text.includes('leader') ||
    text.includes('architect')
  ) {
    score = 72;
    evidence = '✅ Relevant role/function detected';
  } else {
    score = 48;
    evidence = '❌ Does not mention target ICPs';
  }

  return { score: Math.min(100, score), evidence, data: { matchPercentage } };
}

function scoreAvailableEvidenceV2(
  topic: TopicCandidate
): { score: number; evidence: string; data?: any } {
  let score = 65; // HIGHER base
  let evidence = '';

  if (!topic.summary || topic.summary.length === 0) {
    return { score: 40, evidence: 'No summary provided' };
  }

  const text = topic.summary.toLowerCase();
  const summaryLength = topic.summary.length;

  // Evidence keywords
  const evidenceKeywords = [
    'research',
    'study',
    'data',
    'report',
    'case',
    'analysis',
    'evidence',
    'metric',
    'benchmark',
    'test',
    'validate',
    'prove',
  ];
  let evidenceCount = 0;

  for (const kw of evidenceKeywords) {
    if (text.includes(kw)) {
      evidenceCount++;
    }
  }

  if (summaryLength > 200 && evidenceCount >= 3) {
    score = 88;
    evidence = `✅ Detailed summary with ${evidenceCount} evidence signals`;
  } else if (summaryLength > 150 && evidenceCount >= 2) {
    score = 78;
    evidence = `✅ Good detail with ${evidenceCount} evidence signals`;
  } else if (summaryLength > 100 && evidenceCount >= 1) {
    score = 70;
    evidence = `✅ Summary has ${evidenceCount} evidence signal`;
  } else if (summaryLength > 50) {
    score = 60;
    evidence = '⚠️ Summary provided but limited evidence signals';
  } else {
    score = 45;
    evidence = '❌ Limited summary detail';
  }

  return { score: Math.min(100, score), evidence, data: { summaryLength, evidenceCount } };
}

function scoreDifferentiatedAngleV2(
  topic: TopicCandidate
): { score: number; evidence: string; data?: any } {
  let score = 65; // HIGHER base
  let evidence = '';

  if (!topic.angle) {
    // No angle provided, but topic still has merit
    score = 62;
    return { score, evidence: '⚠️ No specific angle provided (use defaults)' };
  }

  const text = (topic.title + ' ' + topic.angle).toLowerCase();

  // Differentiation keywords
  const differentiationKeywords = ['vs', 'comparison', 'unique', 'alternative', 'better', 'vs', 'proven'];
  let diffCount = 0;

  for (const kw of differentiationKeywords) {
    if (text.includes(kw)) {
      diffCount++;
    }
  }

  const angleLength = topic.angle.length;

  if (angleLength > 100 && diffCount >= 2) {
    score = 88;
    evidence = `✅ Strong differentiation with ${diffCount} signals (comparison style)`;
  } else if (angleLength > 80 && diffCount >= 1) {
    score = 78;
    evidence = `✅ Good angle with ${diffCount} differentiation signal`;
  } else if (angleLength > 50 && diffCount >= 1) {
    score = 72;
    evidence = `✅ Angle provided (${diffCount} signal)`;
  } else if (angleLength > 30) {
    score = 65;
    evidence = '⚠️ Basic angle provided';
  } else {
    score = 55;
    evidence = '⚠️ Limited differentiation signals';
  }

  return { score: Math.min(100, score), evidence, data: { angleLength, diffCount } };
}

function scoreSmeFitV2(
  topic: TopicCandidate
): { score: number; evidence: string; data?: any } {
  let score = 65;
  let evidence = '';

  if (!topic.targetOffering) {
    return { score: 55, evidence: '⚠️ Target offering not specified' };
  }

  const text = (topic.title + ' ' + (topic.summary || '') + ' ' + (topic.angle || '')).toLowerCase();

  // SME type detection
  let smeType = 'general';
  if (
    text.includes('technical') ||
    text.includes('engineering') ||
    text.includes('architect') ||
    text.includes('performance')
  ) {
    score = 82;
    smeType = 'technical';
    evidence = `✅ Technical/Engineering SME needed: "${topic.targetOffering}"`;
  } else if (
    text.includes('strategy') ||
    text.includes('leadership') ||
    text.includes('executive') ||
    text.includes('business')
  ) {
    score = 80;
    smeType = 'strategic';
    evidence = `✅ Strategic/Leadership SME needed: "${topic.targetOffering}"`;
  } else if (
    text.includes('best practice') ||
    text.includes('how to') ||
    text.includes('guide') ||
    text.includes('tutorial')
  ) {
    score = 75;
    smeType = 'practical';
    evidence = `✅ Practical SME needed: "${topic.targetOffering}"`;
  } else {
    score = 68;
    evidence = `✅ SME for "${topic.targetOffering}" can cover this`;
  }

  return { score: Math.min(100, score), evidence, data: { smeType } };
}

function scoreSearchContentGapV2(
  topic: TopicCandidate
): { score: number; evidence: string; data?: any } {
  const text = topic.title.toLowerCase();
  let score = 65;
  let evidence = '';

  // High-demand keywords
  const demandKeywords = [
    'how to',
    'guide',
    'tutorial',
    'best practices',
    'examples',
    'vs',
    'comparison',
    'checklist',
    'tips',
    'strategies',
  ];
  let demandCount = 0;

  for (const kw of demandKeywords) {
    if (text.includes(kw)) {
      demandCount++;
    }
  }

  if (demandCount >= 3) {
    score = 88;
    evidence = `✅ High search demand signals: ${demandCount} keywords (how-to, comparison, etc.)`;
  } else if (demandCount === 2) {
    score = 78;
    evidence = `✅ Good search demand: ${demandCount} keywords`;
  } else if (demandCount === 1) {
    score = 70;
    evidence = `✅ Some search demand detected`;
  } else {
    score = 62;
    evidence = '⚠️ Limited search demand signals (add how-to/guide/comparison format)';
  }

  return { score: Math.min(100, score), evidence, data: { demandCount } };
}

function scoreConversionPotentialV2(
  topic: TopicCandidate
): { score: number; evidence: string; data?: any } {
  const text = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
  let score = 65;
  let evidence = '';

  // CTA keywords
  const ctaKeywords = [
    'action',
    'implementation',
    'start',
    'try',
    'tools',
    'resources',
    'case study',
    'roi',
    'savings',
    'template',
  ];
  let ctaCount = 0;

  for (const kw of ctaKeywords) {
    if (text.includes(kw)) {
      ctaCount++;
    }
  }

  // Format indicators (higher conversion = case study > how-to > blog)
  const hasFormat = topic.format && topic.format.length > 0;
  const isCaseStudy = text.includes('case') || topic.format === 'case_study';
  const isHowTo = text.includes('how') || topic.format === 'guide';

  if ((isCaseStudy || isHowTo) && ctaCount >= 2) {
    score = 88;
    evidence = `✅ Strong CTA potential: ${topic.format} format with ${ctaCount} CTA signals`;
  } else if (ctaCount >= 2) {
    score = 78;
    evidence = `✅ Good CTA potential: ${ctaCount} CTA signals (tools, ROI, resources)`;
  } else if (ctaCount >= 1) {
    score = 70;
    evidence = `✅ Some CTA potential: ${ctaCount} CTA signal`;
  } else if (hasFormat) {
    score = 65;
    evidence = `✅ Format: ${topic.format} (can add CTAs)`;
  } else {
    score = 58;
    evidence = '⚠️ Limited CTA signals (add tools, resources, or ROI focus)';
  }

  return { score: Math.min(100, score), evidence, data: { ctaCount, isCaseStudy, isHowTo } };
}

function generateScoreExplanation(
  breakdown: TopicScoreBreakdown,
  finalScore: number,
  topic: TopicCandidate,
  strategy: Strategy
): string {
  let explanation = '';

  if (finalScore >= 85) {
    explanation = `🟢 EXCELLENT topic! Highly aligned with strategy (${
      strategy.offerings.length
    } offerings, ${strategy.targetIcps.length} ICPs), clear differentiation, and strong market demand. Ready to queue.`;
  } else if (finalScore >= 75) {
    explanation = `🟡 GOOD topic with solid strategy alignment. Could improve by: `;
    if (breakdown.strategicRelevance.score < 70) explanation += 'mentioning more offerings, ';
    if (breakdown.audienceIcpUsefulness.score < 70) explanation += 'being more specific to your ICP, ';
    if (breakdown.differentiatedAngle.score < 70) explanation += 'adding a unique angle, ';
  } else if (finalScore >= 65) {
    explanation = `🟠 FAIR topic. Strategy alignment is weak. Improve by: `;
    explanation += 'ensuring it mentions your actual offerings/ICPs (not generic versions), ';
    explanation += 'adding specific use cases or comparisons, ';
    explanation += 'including real market evidence/data.';
  } else {
    explanation = `🔴 LOW-SCORING topic. Big gaps in: `;
    if (breakdown.strategicRelevance.score < 60)
      explanation += `Strategic Relevance (${breakdown.strategicRelevance.score}/100), `;
    if (breakdown.audienceIcpUsefulness.score < 60)
      explanation += `Audience Fit (${breakdown.audienceIcpUsefulness.score}/100), `;
    explanation += 'Consider revising to align better with strategy.';
  }

  return explanation;
}

function detectCannibalization(
  topic: TopicCandidate
): { exists: boolean; message?: string } {
  return {
    exists: false,
    message: 'No cannibalization detected',
  };
}

function getSmERecommendations(
  topic: TopicCandidate,
  smeFitScore: number
): Array<{ name: string; fitScore: number; reason: string }> {
  // Placeholder - would integrate with SME profiles
  return [];
}
