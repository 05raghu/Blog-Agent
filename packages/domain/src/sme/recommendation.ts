// SME Recommendation Engine - Score SMEs against topics
// Based on PRD P0.4: topic fit, evidence needs, availability, prior work

export interface SMERecommendation {
  smeId: string;
  smeName: string;
  fitScore: number; // 0-100
  topicFitScore: number; // expertise match
  availabilityScore: number; // capacity available
  priorWorkScore: number; // experience bonus
  reasoning: {
    topicFit: string;
    availability: string;
    priorWork: string;
  };
}

interface SMEProfile {
  id: string;
  name: string;
  expertise: string[];
  capacityHoursPerMonth: number;
  hoursUsed?: number;
  pastContributions?: string[];
}

interface Topic {
  title: string;
  summary?: string;
  angle?: string;
  targetOffering?: string;
  format?: string;
}

export function recommendSMEsForTopic(
  topic: Topic,
  smes: SMEProfile[],
  existingArticleCount: number = 0
): SMERecommendation[] {
  if (smes.length === 0) return [];

  // Score each SME
  const scored = smes.map((sme) => {
    const topicFitScore = calculateTopicFit(topic, sme);
    const availabilityScore = calculateAvailability(sme);
    const priorWorkScore = calculatePriorWork(sme, existingArticleCount);

    // Weighted average: 50% topic fit, 30% availability, 20% prior work
    const fitScore = Math.round(
      topicFitScore * 0.5 + availabilityScore * 0.3 + priorWorkScore * 0.2
    );

    return {
      smeId: sme.id,
      smeName: sme.name,
      fitScore,
      topicFitScore,
      availabilityScore,
      priorWorkScore,
      reasoning: {
        topicFit: generateTopicFitReasoning(topic, sme, topicFitScore),
        availability: generateAvailabilityReasoning(sme, availabilityScore),
        priorWork: generatePriorWorkReasoning(sme, priorWorkScore),
      },
    };
  });

  // Sort by fit score (descending) and return top 3
  return scored.sort((a, b) => b.fitScore - a.fitScore).slice(0, 3);
}

function calculateTopicFit(topic: Topic, sme: SMEProfile): number {
  // Extract keywords from topic
  const topicText = `${topic.title} ${topic.summary || ''} ${topic.angle || ''} ${topic.targetOffering || ''}`.toLowerCase();
  const topicWords = topicText.split(/\s+/).filter((w) => w.length > 3);

  // Match against SME expertise areas
  const expertiseMatches = sme.expertise.filter((exp) => {
    const expLower = exp.toLowerCase();
    return topicWords.some((word) => expLower.includes(word) || word.includes(expLower));
  });

  // Score: 0-100 based on expertise match
  // Full match on all expertise areas = 100
  if (sme.expertise.length === 0) return 30; // Generic SME
  const matchRatio = expertiseMatches.length / sme.expertise.length;
  return Math.round(30 + matchRatio * 70); // 30-100
}

function calculateAvailability(sme: SMEProfile): number {
  const capacityHours = sme.capacityHoursPerMonth || 0;
  const usedHours = sme.hoursUsed || 0;
  const availableHours = Math.max(0, capacityHours - usedHours);

  // Assume article interview takes ~5 hours
  const hourNeeded = 5;

  if (availableHours >= hourNeeded * 2) return 100; // Plenty of capacity
  if (availableHours >= hourNeeded) return 75; // Can do this article
  if (availableHours >= hourNeeded * 0.5) return 50; // Limited capacity
  return 25; // Almost at capacity
}

function calculatePriorWork(sme: SMEProfile, existingArticleCount: number): number {
  const priorCount = (sme.pastContributions?.length || 0) + existingArticleCount;

  // More prior work = higher confidence
  if (priorCount >= 3) return 100;
  if (priorCount === 2) return 80;
  if (priorCount === 1) return 60;
  return 40; // New SME (less risky than expected)
}

function generateTopicFitReasoning(topic: Topic, sme: SMEProfile, score: number): string {
  const offering = topic.targetOffering || 'this topic';
  const expertiseList = sme.expertise.slice(0, 2).join(', ');

  if (score >= 80) {
    return `Expert in ${expertiseList}. Strong match for ${offering}`;
  }
  if (score >= 60) {
    return `Relevant expertise in ${expertiseList}. Good fit for ${offering}`;
  }
  if (score >= 40) {
    return `Some relevant expertise. Can contribute to ${offering}`;
  }
  return `Limited direct expertise, but can provide perspective on ${offering}`;
}

function generateAvailabilityReasoning(sme: SMEProfile, score: number): string {
  const availableHours = Math.max(0, (sme.capacityHoursPerMonth || 0) - (sme.hoursUsed || 0));

  if (score >= 75) {
    return `${availableHours}+ hours/month available`;
  }
  if (score >= 50) {
    return `${availableHours} hours/month available (limited capacity)`;
  }
  return `${availableHours} hours/month available (at capacity)`;
}

function generatePriorWorkReasoning(sme: SMEProfile, score: number): string {
  const priorCount = sme.pastContributions?.length || 0;

  if (priorCount >= 3) {
    return `Experienced: interviewed for ${priorCount}+ articles`;
  }
  if (priorCount === 2) {
    return `Familiar with process: interviewed for 2 articles`;
  }
  if (priorCount === 1) {
    return `Some interview experience`;
  }
  return `First time; fresh perspective`;
}
