// LLM Topic Scorer — Uses Claude to intelligently evaluate topics

import Anthropic from '@anthropic-ai/sdk';
import {
  TopicScorerProvider,
  TopicScoringParams,
  LLMTopicScoreResult,
} from './index';

export class AnthropicTopicScorer implements TopicScorerProvider {
  private client: Anthropic;
  private model = 'claude-haiku-4-5-20251001';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async scoreTopic(params: TopicScoringParams): Promise<LLMTopicScoreResult> {
    const prompt = this.buildScoringPrompt(params);

    try {
      console.log('[TopicScorer] Scoring topic:', params.topic.title.substring(0, 50));

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.3,
        system: this.getSystemPrompt(),
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const result = this.parseResponse(content.text);
      return result;
    } catch (error) {
      console.error('[TopicScorer] Scoring failed:', error);
      throw error;
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert B2B SaaS content strategist evaluating blog topics.

Score a topic on 7 dimensions (0-100 each) based on alignment with the company's strategy.

For EACH dimension, provide:
1. score (0-100)
2. reasoning (one sentence explaining the score)
3. suggestions (array of 2-3 strings on how to improve, if applicable)

SCORING GUIDELINES:

1. STRATEGIC RELEVANCE (25%) - Does it align with offerings?
   90-100: Directly addresses 2+ specific offerings
   75-89: Addresses 1+ offering with good context
   60-74: Related to offerings but somewhat generic
   40-59: Loosely related
   0-39: No alignment

2. AUDIENCE/ICP USEFULNESS (15%) - Solves problems for target customers?
   90-100: Targets 2+ ICPs with exact challenges
   75-89: Targets 1+ ICP with clear relevance
   60-74: Related to customer roles but generic
   40-59: Vague audience targeting
   0-39: No audience alignment

3. AVAILABLE EVIDENCE & DEMAND (15%) - Real market data?
   90-100: High search demand + research/case studies + strong market signals
   75-89: Medium search demand + some evidence signals
   60-74: General topic with assumed demand or moderate search interest
   40-59: Vague, limited evidence or low search signals
   0-39: No evidence signals or no market demand

4. DIFFERENTIATED ANGLE (15%) - What makes it unique?
   90-100: Novel angle (proprietary, comparison, research)
   75-89: Clear differentiation vs competitors
   60-74: Some differentiation signals
   40-59: Generic angle
   0-39: No differentiation

5. SME FIT (10%) - Subject-matter expertise available?
   90-100: Perfect fit for multiple SME areas
   75-89: Matches 1+ SME expertise well
   60-74: Can be covered by available expertise
   40-59: Requires some research/learning
   0-39: Requires expertise company lacks

6. SEARCH/CONTENT GAP (10%) - Search demand? Can we rank?
   90-100: High-demand keywords (how-to, guide, comparison, tutorial)
   75-89: Good demand signals
   60-74: Some search potential
   40-59: Limited search demand
   0-39: Niche/no search demand

7. CONVERSION/DISTRIBUTION (10%) - Can it drive leads and sharing?
   90-100: High-conversion format (case study, comparison) + strong CTAs
   75-89: Good CTA potential
   60-74: Some conversion signals
   40-59: Limited CTA potential
   0-39: Low conversion likelihood

Return ONLY valid JSON (no markdown):
{
  "totalScore": <0-100>,
  "confidence": <0-100>,
  "breakdown": {
    "strategicRelevance": {
      "score": <0-100>,
      "reasoning": "<one sentence>",
      "suggestions": ["<suggestion>", ...]
    },
    "audienceIcpUsefulness": { "score": <0-100>, "reasoning": "<one sentence>", "suggestions": [...] },
    "availableEvidenceAndDemand": { "score": <0-100>, "reasoning": "<one sentence>", "suggestions": [...] },
    "differentiatedAngle": { "score": <0-100>, "reasoning": "<one sentence>", "suggestions": [...] },
    "smeFit": { "score": <0-100>, "reasoning": "<one sentence>", "suggestions": [...] },
    "searchContentGap": { "score": <0-100>, "reasoning": "<one sentence>", "suggestions": [...] },
    "conversionDistributionPotential": { "score": <0-100>, "reasoning": "<one sentence>", "suggestions": [...] }
  },
  "overallRecommendation": "<Queue immediately | Good, could improve | Fair, needs work | Not ready>"
}`;
  }

  private buildScoringPrompt(params: TopicScoringParams): string {
    const { topic, strategy, searchDemand } = params;

    let demandSection = '';
    if (searchDemand) {
      demandSection = `
REAL MARKET DATA (from Google):
Estimated Monthly Searches: ${searchDemand.estimatedMonthlySearches.toLocaleString()}
Demand Level: ${searchDemand.demandLevel}
Search Results: ~${searchDemand.resultCount.toLocaleString()}
Trending: ${searchDemand.trending ? 'Yes' : 'No'}

Use this real market data to inform your "AVAILABLE EVIDENCE & DEMAND" score.
Higher search volume = stronger evidence of real demand.`;
    }

    return `TOPIC TO SCORE:
Title: "${topic.title}"
${topic.summary ? `Summary: "${topic.summary}"` : 'Summary: (not provided)'}
${topic.angle ? `Angle: "${topic.angle}"` : 'Angle: (not provided)'}
${topic.targetOffering ? `Target Offering: "${topic.targetOffering}"` : ''}
${topic.format ? `Format: ${topic.format}` : ''}
${topic.geography ? `Geography: ${topic.geography}` : ''}
${topic.audience ? `Audience: "${topic.audience}"` : ''}

COMPANY STRATEGY (evaluate against):
Offerings: ${strategy.offerings.join(', ')}
Target ICPs: ${strategy.targetIcps.join(', ')}
Geographies: ${strategy.geographies.join(', ')}
Competitors: ${strategy.competitors.join(', ')}
Content Mix: ${Object.entries(strategy.contentMix)
      .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
      .join(', ')}
${demandSection}

SCORE THIS TOPIC on all 7 dimensions. Return ONLY valid JSON.`;
  }

  private parseResponse(text: string): LLMTopicScoreResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const confidence = this.calculateConfidence(parsed);

      return {
        totalScore: Math.round(parsed.totalScore),
        confidence,
        breakdown: {
          strategicRelevance: parsed.breakdown.strategicRelevance,
          audienceIcpUsefulness: parsed.breakdown.audienceIcpUsefulness,
          availableEvidenceAndDemand: parsed.breakdown.availableEvidenceAndDemand,
          differentiatedAngle: parsed.breakdown.differentiatedAngle,
          smeFit: parsed.breakdown.smeFit,
          searchContentGap: parsed.breakdown.searchContentGap,
          conversionDistributionPotential: parsed.breakdown.conversionDistributionPotential,
        },
        overallRecommendation: parsed.overallRecommendation,
      };
    } catch (error) {
      console.error('[TopicScorer] Parse error:', error);
      throw new Error('Failed to parse topic score response');
    }
  }

  private calculateConfidence(parsed: any): number {
    const scores = [
      parsed.breakdown.strategicRelevance.score,
      parsed.breakdown.audienceIcpUsefulness.score,
      parsed.breakdown.availableEvidenceAndDemand.score,
      parsed.breakdown.differentiatedAngle.score,
      parsed.breakdown.smeFit.score,
      parsed.breakdown.searchContentGap.score,
      parsed.breakdown.conversionDistributionPotential.score,
    ];

    const variance = Math.max(...scores) - Math.min(...scores);
    const isDecisive = variance > 15;

    return isDecisive ? 92 : 75;
  }
}
