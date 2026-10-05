// Extract structured insights from SME briefing session responses
// Classifies responses into positions, examples, caveats, and recommendations

export interface BriefingInsights {
  positions: Array<{ question: string; answer: string; confidence: 'high' | 'medium' | 'low' }>;
  examples: Array<{ question: string; answer: string; type: 'case_study' | 'scenario' | 'real_world' }>;
  caveats: Array<{ question: string; answer: string }>;
  recommendations: Array<{ question: string; answer: string }>;
  quotable: Array<{ question: string; answer: string; quotability: 'high' | 'medium' | 'low' }>;
  gaps: string[]; // Unanswered or skipped questions
}

const INSIGHT_KEYWORDS = {
  positions: [
    'believe', 'think', 'position', 'viewpoint', 'perspective', 'contrary', 'disagree',
    'unique', 'differentiated', 'approach', 'philosophy', 'stance', 'direction'
  ],
  examples: [
    'example', 'case', 'scenario', 'situation', 'instance', 'story', 'saw', 'happened',
    'worked with', 'client', 'project', 'real-world', 'experienced', 'witnessed'
  ],
  caveats: [
    'but', 'however', 'caveat', 'caution', 'risk', 'challenge', 'difficult', 'downside',
    'exception', 'avoid', 'wrong', 'mistake', 'pitfall', 'limitation', 'trade-off'
  ],
  recommendations: [
    'recommend', 'suggest', 'should', 'must', 'best practice', 'approach', 'way',
    'do this', 'try', 'implement', 'use', 'invest in', 'focus on', 'prioritize'
  ]
};

function classifyResponse(answer: string): string[] {
  const classes: string[] = [];
  const lower = answer.toLowerCase();

  if (INSIGHT_KEYWORDS.positions.some(kw => lower.includes(kw))) {
    classes.push('position');
  }
  if (INSIGHT_KEYWORDS.examples.some(kw => lower.includes(kw))) {
    classes.push('example');
  }
  if (INSIGHT_KEYWORDS.caveats.some(kw => lower.includes(kw))) {
    classes.push('caveat');
  }
  if (INSIGHT_KEYWORDS.recommendations.some(kw => lower.includes(kw))) {
    classes.push('recommendation');
  }

  return classes.length > 0 ? classes : ['other'];
}

function getQuotability(answer: string): 'high' | 'medium' | 'low' {
  const words = answer.split(/\s+/).length;
  // High quotability: 1-3 sentences, conversational, has opinion
  if (words < 50 && !answer.includes('I think') && !answer.includes('In my')) return 'low';
  if (words > 200) return 'low';
  if (answer.match(/[!?]/) || answer.includes('we ') || answer.includes('you ')) return 'high';
  return 'medium';
}

export function extractInsights(
  responses: Record<string, string>,
  questions: Array<{ id: string; text: string; order: number }>
): BriefingInsights {
  const insights: BriefingInsights = {
    positions: [],
    examples: [],
    caveats: [],
    recommendations: [],
    quotable: [],
    gaps: [],
  };

  questions.forEach((q) => {
    const answer = responses[q.id]?.trim();

    if (!answer) {
      insights.gaps.push(q.text);
      return;
    }

    const classes = classifyResponse(answer);

    if (classes.includes('position')) {
      insights.positions.push({
        question: q.text,
        answer,
        confidence: 'high',
      });
    }

    if (classes.includes('example')) {
      insights.examples.push({
        question: q.text,
        answer,
        type: answer.toLowerCase().includes('case') ? 'case_study' : 'real_world',
      });
    }

    if (classes.includes('caveat')) {
      insights.caveats.push({
        question: q.text,
        answer,
      });
    }

    if (classes.includes('recommendation')) {
      insights.recommendations.push({
        question: q.text,
        answer,
      });
    }

    // Add quotable insights (opinions, advice, perspectives)
    if (
      answer.includes('I ') ||
      answer.includes('we ') ||
      answer.includes('you ') ||
      answer.includes('believe') ||
      answer.match(/[!?]/)
    ) {
      insights.quotable.push({
        question: q.text,
        answer,
        quotability: getQuotability(answer),
      });
    }
  });

  return insights;
}
