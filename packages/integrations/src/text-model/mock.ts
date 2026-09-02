// Mock TextModel implementation — deterministic responses for testing/demo without API keys

import { TextModelProvider, DraftParams, Critique, CritiqueParams, RevisionParams } from './index';

export class MockTextModel implements TextModelProvider {
  async generateDraft(params: DraftParams): Promise<string> {
    // Simulate draft generation with realistic structure
    const title = params.brief.split('\n')[0] || 'Article Title';
    const wordCount = params.targetLength || 2000;

    return `# ${title}

## Introduction

This article explores key insights and findings relevant to your audience. Based on the strategic brief and content outline provided, we'll dive into the core concepts and practical applications.

## Key Insights

The research indicates several important trends:

1. **Primary Finding** — Data-backed observation about your industry showing a 40% year-over-year increase in adoption.

2. **Secondary Pattern** — Emerging behavior among target ICP, supported by case study evidence from 3+ industry leaders.

3. **Opportunity Gap** — Market segment currently underserved, representing a $2B+ TAM with limited existing solutions.

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
}
