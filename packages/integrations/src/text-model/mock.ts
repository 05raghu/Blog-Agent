// Mock TextModel implementation — deterministic responses for testing/demo without API keys

import { TextModelProvider, BriefParams, OutlineParams, DraftParams, Critique, CritiqueParams, RevisionParams, SEOAnalysisParams, SEOAnalysisResult, LinkSuggestionParams, LinkSuggestion, CTAParams, CTAResult, TopicGenerationParams, GeneratedTopicCandidate } from './index';

export class MockTextModel implements TextModelProvider {
  async generateBrief(params: BriefParams): Promise<string> {
    const titles = params.title.split(' ');
    const keyword = titles[0];

    return `This article explores key insights and best practices around ${keyword}. We'll examine current market trends, real-world implementations, and actionable strategies for success. Perfect for decision-makers looking to stay competitive.`;
  }

  async generateOutline(params: OutlineParams): Promise<string> {
    const auditence = params.targetAudience ? `for ${params.targetAudience}` : '';
    return `## Introduction
- Overview of ${params.title} ${auditence}
- Why this matters now
- What readers will learn

## Market Context & Trends
- Current landscape and statistics
- Key drivers and catalysts
- Competitive environment

## Core Concepts & Best Practices
- Fundamental approaches
- Industry-leading strategies
- Real-world implementations

## Challenges & Solutions
- Common obstacles teams face
- Proven mitigation approaches
- Lessons from the field

## Implementation Roadmap
- Getting started checklist
- Step-by-step process
- Tools and resources

## Conclusion & Next Steps
- Key takeaways
- Recommended actions
- Resources for further learning`;
  }

  async generateDraft(params: DraftParams): Promise<string> {
    // Simulate draft generation with realistic structure
    const title = params.brief.split('\n')[0] || 'Article Title';
    const wordCount = params.targetLength || 2000;

    // Build insights section if briefing data is available
    let insightsContent = '';
    if (params.briefingInsights) {
      const insights = params.briefingInsights;
      const insightParts: string[] = [];

      if (insights.positions && insights.positions.length > 0) {
        const position = insights.positions[0];
        insightParts.push(`**Expert Perspective:** "${position.answer}"`);
      }

      if (insights.examples && insights.examples.length > 0) {
        const example = insights.examples[0];
        insightParts.push(`**Real-World Example:** ${example.answer}`);
      }

      if (insights.recommendations && insights.recommendations.length > 0) {
        const rec = insights.recommendations[0];
        insightParts.push(`**Recommended Approach:** ${rec.answer}`);
      }

      if (insightParts.length > 0) {
        insightsContent = `\n\n## Expert Insights\n\n${insightParts.join('\n\n')}\n`;
      }
    }

    return `# ${title}

## Introduction

This article explores key insights and findings relevant to your audience. Based on the strategic brief and content outline provided, we'll dive into the core concepts and practical applications.

## Key Insights

The research indicates several important trends:

1. **Primary Finding** — Data-backed observation about your industry showing a 40% year-over-year increase in adoption.

2. **Secondary Pattern** — Emerging behavior among target ICP, supported by case study evidence from 3+ industry leaders.

3. **Opportunity Gap** — Market segment currently underserved, representing a $2B+ TAM with limited existing solutions.
${insightsContent}

## What This Means for Your Audience

For decision-makers in your target market, the implications are clear:

- Organizations that adopt this pattern early gain 3-5x competitive advantage
- Workflow efficiency improves by 60% based on observed implementations
- Time-to-value typically ranges 4-8 weeks from pilot to production

## How Leading Teams Are Responding

Case Study Example: TechCorp (500-person SaaS)
- Implemented approach in Q2 2025
- Achieved 45% reduction in manual effort
- Expanded program to 3 additional teams by Q4

## Practical Steps to Get Started

1. **Assess Current State** — Evaluate existing processes against the recommended framework
2. **Pilot with Low-Risk Use Case** — Start with one team or department (4-week sprint)
3. **Measure & Learn** — Track key metrics (time saved, quality improvements, team satisfaction)
4. **Scale Gradually** — Expand to other teams based on pilot learnings

## Conclusion

The evidence is compelling: organizations that move deliberately on this front position themselves for sustainable competitive advantage. The window of opportunity is now—many competitors are still unaware of the shift happening in the market.

## Next Steps

- Explore the full analysis with your team
- Identify your first low-risk use case
- Consider a 4-week pilot program

---

*Word count: ~${wordCount} words | Generated for demonstration*`;
  }

  async generateCritique(params: CritiqueParams): Promise<Critique> {
    // Deterministic critique based on content length
    const contentLength = params.current.length;
    const hasEvidenceReferences = /case study|data|research|found/i.test(params.current);
    const hasExamples = /example|instance|demonstrate|show/i.test(params.current);

    const issues: Array<{severity: 'p0'|'p1'|'p2'|'p3'; category: 'evidence'|'clarity'|'brand'|'engagement'; message: string}> = [];
    const suggestions: string[] = [];

    // Simulate realistic critiques
    if (contentLength < 1500) {
      issues.push({
        severity: 'p1',
        category: 'evidence',
        message: 'Content is under target length; add 1-2 more sections with examples',
      });
      suggestions.push('Expand with a "How to Implement" section with step-by-step guidance');
    }

    if (!hasEvidenceReferences) {
      issues.push({
        severity: 'p1',
        category: 'evidence',
        message: 'Missing data-backed claims; add 2-3 research references or case studies',
      });
      suggestions.push('Include statistics, analyst reports, or customer success examples');
    }

    if (!hasExamples) {
      issues.push({
        severity: 'p2',
        category: 'clarity',
        message: 'Abstract in places; concrete examples would improve comprehension',
      });
      suggestions.push('Add a real-world scenario or customer journey to illustrate key points');
    }

    // Brand voice check
    if (/very unique|revolutionary|game-changing|best-in-class/i.test(params.current)) {
      issues.push({
        severity: 'p2',
        category: 'brand',
        message: 'Marketing superlatives detected; replace with specific value propositions',
      });
      suggestions.push('Use measurable claims instead (e.g., "3x faster" instead of "revolutionary")');
    }

    // Engagement check
    if (!/(conclusion|next step|action|recommend)/i.test(params.current)) {
      issues.push({
        severity: 'p3',
        category: 'engagement',
        message: 'No clear call-to-action or next steps for readers',
      });
      suggestions.push('Add "Next Steps" section with 2-3 concrete actions readers can take');
    }

    const score = Math.max(60, Math.min(95, 70 + (hasEvidenceReferences ? 15 : 0) + (hasExamples ? 10 : 0) - issues.length * 5));

    return {
      score,
      issues,
      suggestions,
    };
  }

  async generateRevision(params: RevisionParams): Promise<string> {
    // Simple revision: add a section addressing the feedback
    const feedback = params.feedback.toLowerCase();
    let revision = params.current;

    if (feedback.includes('evidence') || feedback.includes('data')) {
      revision += `

## Research & Data Supporting This Analysis

Recent industry research from Gartner (2025) shows:
- 73% of organizations plan to adopt this approach within 18 months
- Early adopters report 45% improvement in key metrics
- Market growth projected at 28% CAGR through 2027

These findings align with our observations across customer implementations.`;
    }

    if (feedback.includes('example') || feedback.includes('concrete')) {
      revision += `

## Real-World Implementation Example

Consider a mid-market SaaS company with 150 employees. They implemented this framework across their product team:

**Before:** 3 weeks from requirements to deployment, with significant rework
**After:** 10 days from requirements to deployment, with 95% first-pass quality

The 60% time reduction freed up the team to focus on higher-value strategic initiatives.`;
    }

    if (feedback.includes('action') || feedback.includes('next step')) {
      revision += `

## Immediate Next Steps

Start this week:
1. Schedule 30-min workshop with your core team (Tuesday)
2. Identify one pilot project (by Friday)
3. Define success metrics (by Friday)

Move forward next week:
4. Run the pilot (2-3 weeks duration)
5. Measure results weekly
6. Decide on broader rollout by end of month`;
    }

    return revision;
  }

  async analyzeSEO(params: SEOAnalysisParams): Promise<SEOAnalysisResult> {
    // Extract primary keyword from title (simple heuristic)
    const titleWords = params.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const primaryKeyword = titleWords[0] || 'article';

    // Count keyword occurrences
    const contentLower = params.content.toLowerCase();
    const keywordOccurrences = (contentLower.match(new RegExp(primaryKeyword, 'g')) || []).length;
    const wordCount = params.content.split(/\s+/).length;
    const keywordDensity = (keywordOccurrences / wordCount) * 100;

    // Readability score (Flesch-Kincaid grade level)
    const sentences = params.content.split(/[.!?]+/).filter(s => s.trim());
    const words = params.content.split(/\s+/);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    const readabilityScore = Math.max(0, Math.min(18,
      206.835 - (1.015 * (words.length / Math.max(1, sentences.length))) -
      (84.6 * (syllables / Math.max(1, words.length)))
    ));

    // Meta description
    const firstSentence = params.content.split(/[.!?]/)[0]?.trim() || params.brief || params.title;
    const metaDescription = firstSentence.substring(0, 160);

    // Issues
    const issues = [];
    if (params.title.length < 30) {
      issues.push({ type: 'warning' as const, message: 'Title is too short. Aim for 30-60 characters.' });
    }
    if (keywordDensity < 1) {
      issues.push({ type: 'warning' as const, message: `Keyword "${primaryKeyword}" appears infrequently.` });
    } else if (keywordDensity > 5) {
      issues.push({ type: 'warning' as const, message: `Keyword "${primaryKeyword}" is overused.` });
    }
    if (wordCount < 600) {
      issues.push({ type: 'warning' as const, message: `Article is ${wordCount} words. Aim for 600+.` });
    }

    // Suggestions
    const suggestions = [];
    if (params.title.length >= 30 && params.title.length <= 60) {
      suggestions.push(`✓ Title length optimal (${params.title.length} chars)`);
    }
    if (keywordDensity >= 1 && keywordDensity <= 3) {
      suggestions.push(`✓ Keyword density good (${keywordDensity.toFixed(2)}%)`);
    }
    if (wordCount >= 600) {
      suggestions.push(`✓ Article length sufficient (${wordCount} words)`);
    }

    // Calculate score
    let score = 50;
    if (params.title.length >= 30 && params.title.length <= 60) score += 15;
    if (keywordDensity >= 1 && keywordDensity <= 3) score += 15;
    if (wordCount >= 600) score += 15;
    if ((params.content.match(/^#+\s/gm) || []).length > 0) score += 10;
    score = Math.min(100, score);

    return {
      score: Math.round(score),
      keyword: primaryKeyword,
      keywordDensity: parseFloat(keywordDensity.toFixed(2)),
      readabilityScore: Math.round(readabilityScore / 2),
      metaDescription,
      issues,
      suggestions: suggestions.length > 0 ? suggestions : ['Continue optimizing for better results'],
    };
  }

  async suggestInternalLinks(params: LinkSuggestionParams): Promise<LinkSuggestion[]> {
    // Deterministic keyword-based matching (current algorithm)
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    ]);

    const extractKeywords = (text: string): Set<string> => {
      const cleaned = text
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/#+\s+/g, '')
        .toLowerCase();

      const words = cleaned
        .split(/\s+/)
        .filter(w => {
          const clean = w.replace(/[^a-z0-9]/g, '');
          return clean.length > 3 && !stopwords.has(clean);
        })
        .map(w => w.replace(/[^a-z0-9]/g, ''));

      return new Set(words);
    };

    const calculateSimilarity = (kw1: Set<string>, kw2: Set<string>): number => {
      if (kw1.size === 0 || kw2.size === 0) return 0;
      const intersection = new Set([...kw1].filter(k => kw2.has(k)));
      const union = new Set([...kw1, ...kw2]);
      return (intersection.size / union.size) * 100;
    };

    const currentKeywords = extractKeywords(`${params.currentTitle} ${params.currentContent}`);

    const suggestions: LinkSuggestion[] = params.candidates
      .map(candidate => {
        const candidateKeywords = extractKeywords(`${candidate.title} ${candidate.excerpt}`);
        const relevance = calculateSimilarity(currentKeywords, candidateKeywords);

        return {
          id: candidate.id,
          title: candidate.title,
          relevance: Math.round(relevance * 100) / 100,
          suggestedAnchor: `Learn more about ${candidate.title.toLowerCase()}`,
          rationale: `Shares ${Math.round(relevance)}% keyword overlap with current article`,
        };
      })
      .filter(s => s.relevance >= 15)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 4);

    return suggestions;
  }

  private countSyllables(word: string): number {
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }

    if (word.endsWith('e')) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  async generateCTA(params: CTAParams): Promise<CTAResult> {
    // Generate deterministic CTAs based on title
    const titleWords = params.title.toLowerCase().split(' ');
    const mainTopic = titleWords[0];

    // Generic CTA templates for mock mode
    const cta1 = {
      text: `Get the free ${mainTopic} checklist`,
      rationale: `Provides immediate value and matches the ${mainTopic} topic covered in your article`,
    };

    const cta2 = {
      text: `Schedule a demo to see how we help`,
      rationale: `Conversion-focused CTA for readers ready to evaluate solutions`,
    };

    return {
      ctas: [cta1, cta2],
    };
  }

  async generateTopicCandidates(params: TopicGenerationParams): Promise<GeneratedTopicCandidate[]> {
    const { strategy, seed, count } = params;
    const offerings = strategy.offerings?.length ? strategy.offerings : ['your product'];
    const results: GeneratedTopicCandidate[] = [];

    const anglePatterns = [
      { angle: 'Practical implementation guide', format: 'guide' },
      { angle: 'Comparison', format: 'blog' },
      { angle: 'Case study', format: 'case_study' },
      { angle: 'Best practices', format: 'guide' },
      { angle: 'Checklist', format: 'guide' },
      { angle: 'ROI / business case', format: 'whitepaper' },
      { angle: 'Technical deep dive', format: 'blog' },
      { angle: 'Trends & predictions', format: 'blog' },
      { angle: 'Common mistakes', format: 'blog' },
      { angle: "Buyer's guide", format: 'whitepaper' },
    ];

    for (let i = 0; i < count; i++) {
      const offering = offerings[i % offerings.length];
      const pattern = anglePatterns[i % anglePatterns.length];
      const geography = strategy.geographies?.length ? strategy.geographies[i % strategy.geographies.length] : undefined;
      const audience = strategy.targetIcps?.length ? strategy.targetIcps[i % strategy.targetIcps.length] : undefined;

      let title = `${pattern.angle} for ${offering}`;
      if (seed) {
        title = `${title}: Focus on ${seed}`;
      }

      results.push({
        title,
        summary: `A ${pattern.angle.toLowerCase()} exploring ${offering}${audience ? ` for ${audience}` : ''}.${seed ? ` Framed around: "${seed}".` : ''}`,
        angle: pattern.angle,
        targetOffering: strategy.offerings?.length ? offering : undefined,
        format: pattern.format,
        geography,
        audience,
      });
    }

    return results;
  }
}
