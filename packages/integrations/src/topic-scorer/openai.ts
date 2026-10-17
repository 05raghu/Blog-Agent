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

For each of 7 dimensions, score 0-100 and provide:
- score: 0-100
- reasoning: one sentence explaining the score
- suggestions: array of 2-3 improvement suggestions

Dimensions:
1. Strategic Relevance (25%) - Alignment with offerings
2. Audience/ICP Usefulness (15%) - Relevance to target customers
3. Available Evidence & Demand (15%) - Market data backing
4. Differentiated Angle (15%) - Unique positioning
5. SME Fit (10%) - Subject-matter expertise fit
6. Search/Content Gap (10%) - Search demand signals
7. Conversion/Distribution (10%) - Lead generation potential

Return ONLY valid JSON with breakdown and overallRecommendation.`;
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
      console.log('[TopicScorer:OpenAI] Parsed successfully, totalScore:', parsed.totalScore);

      return {
        totalScore: Math.round(parsed.totalScore),
        confidence: parsed.confidence || 85,
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
      console.error('[TopicScorer:OpenAI] Parse error:', error);
      console.error('[TopicScorer:OpenAI] Full response was:', text);
      throw new Error('Failed to parse topic score response');
    }
  }
}
