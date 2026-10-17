// OpenAI Topic Scorer — Alternative LLM-based evaluation using GPT-4o-mini

import OpenAI from 'openai';
import {
  TopicScorerProvider,
  TopicScoringParams,
  LLMTopicScoreResult,
} from './index';

export class OpenAITopicScorer implements TopicScorerProvider {
  private client: OpenAI;
  private model = 'gpt-4o-mini';

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async scoreTopic(params: TopicScoringParams): Promise<LLMTopicScoreResult> {
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildScoringPrompt(params);

    try {
      console.log('[TopicScorer:OpenAI] Scoring topic:', params.topic.title.substring(0, 50));

      const message = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = message.choices[0].message.content;
      console.log('[TopicScorer:OpenAI] Raw response:', content?.substring(0, 300));

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const result = this.parseResponse(content);
      console.log('[TopicScorer:OpenAI] Successfully parsed response');
      return result;
    } catch (error) {
      console.error('[TopicScorer:OpenAI] Scoring failed:', error);
      console.error('[TopicScorer:OpenAI] Error details:', (error as any).response?.data || (error as Error).message);
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
    const { topic, strategy } = params;

    return `Score this topic:

TOPIC:
Title: "${topic.title}"
${topic.summary ? `Summary: "${topic.summary}"` : 'Summary: (not provided)'}
${topic.angle ? `Angle: "${topic.angle}"` : 'Angle: (not provided)'}
${topic.targetOffering ? `Target Offering: "${topic.targetOffering}"` : ''}
${topic.format ? `Format: ${topic.format}` : ''}
${topic.geography ? `Geography: ${topic.geography}` : ''}
${topic.audience ? `Audience: "${topic.audience}"` : ''}

STRATEGY:
Offerings: ${strategy.offerings.join(', ')}
Target ICPs: ${strategy.targetIcps.join(', ')}
Geographies: ${strategy.geographies.join(', ')}
Competitors: ${strategy.competitors.join(', ')}
Content Mix: ${Object.entries(strategy.contentMix)
      .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
      .join(', ')}

Return JSON with all 7 dimensions scored.`;
  }

  private parseResponse(text: string): LLMTopicScoreResult {
    try {
      console.log('[TopicScorer:OpenAI] Full raw response:', text.substring(0, 300));

      // Extract JSON from response (may have text before/after)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[TopicScorer:OpenAI] No JSON found in response:', text.substring(0, 200));
        throw new Error('No JSON found in response');
      }

      console.log('[TopicScorer:OpenAI] Extracted JSON:', jsonMatch[0].substring(0, 300));

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[TopicScorer:OpenAI] Parsed object keys:', Object.keys(parsed));

      // Handle both structures: with breakdown or flat with dimension names
      let breakdown = parsed.breakdown;
      if (!breakdown) {
        // Try to extract dimensions from top-level (e.g., "Strategic Relevance", "Audience/ICP Usefulness")
        console.log('[TopicScorer:OpenAI] No breakdown found, attempting to extract flat structure');
        breakdown = {
          strategicRelevance: parsed['Strategic Relevance'] || { score: 0, reasoning: 'N/A' },
          audienceIcpUsefulness: parsed['Audience/ICP Usefulness'] || { score: 0, reasoning: 'N/A' },
          availableEvidenceAndDemand: parsed['Available Evidence & Demand'] || { score: 0, reasoning: 'N/A' },
          differentiatedAngle: parsed['Differentiated Angle'] || { score: 0, reasoning: 'N/A' },
          smeFit: parsed['SME Fit'] || { score: 0, reasoning: 'N/A' },
          searchContentGap: parsed['Search/Content Gap'] || { score: 0, reasoning: 'N/A' },
          conversionDistributionPotential: parsed['Conversion/Distribution'] || { score: 0, reasoning: 'N/A' },
        };
      }

      // Calculate total score from breakdown if not provided
      let totalScore = parsed.totalScore;
      if (!totalScore && breakdown) {
        const scores = Object.values(breakdown).map((d: any) => d?.score || 0);
        totalScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      }

      return {
        totalScore: Math.round(totalScore || 0),
        confidence: parsed.confidence || 85,
        breakdown: {
          strategicRelevance: breakdown.strategicRelevance || { score: 0, reasoning: 'N/A' },
          audienceIcpUsefulness: breakdown.audienceIcpUsefulness || { score: 0, reasoning: 'N/A' },
          availableEvidenceAndDemand: breakdown.availableEvidenceAndDemand || { score: 0, reasoning: 'N/A' },
          differentiatedAngle: breakdown.differentiatedAngle || { score: 0, reasoning: 'N/A' },
          smeFit: breakdown.smeFit || { score: 0, reasoning: 'N/A' },
          searchContentGap: breakdown.searchContentGap || { score: 0, reasoning: 'N/A' },
          conversionDistributionPotential: breakdown.conversionDistributionPotential || { score: 0, reasoning: 'N/A' },
        },
        overallRecommendation: parsed.overallRecommendation || 'Unable to determine',
      };
    } catch (error) {
      console.error('[TopicScorer:OpenAI] Parse error:', error);
      console.error('[TopicScorer:OpenAI] Full response was:', text);
      throw new Error('Failed to parse topic score response');
    }
  }
}
