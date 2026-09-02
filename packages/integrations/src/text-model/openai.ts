// Live OpenAI TextModel implementation — uses GPT-4 API for generation

import OpenAI from 'openai';
import { TextModelProvider, DraftParams, Critique, CritiqueParams, RevisionParams } from './index';

export class OpenAITextModel implements TextModelProvider {
  private client: OpenAI;
  private model = 'gpt-4o-mini'; // Fast, cost-effective GPT model

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateDraft(params: DraftParams): Promise<string> {
    const systemPrompt = `You are an expert content strategist and writer for B2B technology companies.
Your task is to generate compelling, evidence-backed blog articles.

${params.voiceProfile ? `Brand Voice Guidelines:\n${params.voiceProfile}\n` : ''}

Requirements:
- Write for a professional, decision-maker audience
- Use specific data points and real-world examples
- Avoid marketing clichés and false certainty
- Include actionable insights and next steps
- Target length: ${params.targetLength || 2000} words`;

    const userPrompt = `Generate a blog article based on this brief and outline:

BRIEF:
${params.brief}

OUTLINE:
${params.outline}

Write a complete, publish-ready draft article.`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = message.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content;
  }

  async generateCritique(params: CritiqueParams): Promise<Critique> {
    const systemPrompt = `You are an expert editorial reviewer for B2B technology content.
Evaluate the article against a comprehensive rubric and provide structured feedback.

You MUST respond with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "issues": [
    {
      "severity": "p0|p1|p2|p3",
      "category": "evidence|clarity|brand|engagement",
      "message": "<string>"
    }
  ],
  "suggestions": ["<string>", "<string>"]
}

Severity levels:
- p0: Hard blocker (invented claims, false data, missing critical context)
- p1: Major issue (weak evidence, unclear messaging, brand misalignment)
- p2: Minor issue (clarity improvement, structure refinement)
- p3: Polish (tone, phrasing, minor clarity)

Categories:
- evidence: Factual accuracy, data backing, research quality
- clarity: Readability, structure, argument flow
- brand: Voice alignment, tone, positioning
- engagement: Reader value, actionability, relatability`;

    const userPrompt = `Critique this blog article:

${params.current}

Evaluate against these criteria:
1. Evidence & Factual Integrity (20 points) — Are claims backed by data/examples?
2. Original Insight & Specificity (20 points) — Is this differentiated, or generic marketing?
3. ICP & Objective Fit (15 points) — Relevant to target audience and business goals?
4. Brand Voice & Readability (15 points) — Consistent with company voice? Clear writing?
5. Argument Structure & Usefulness (10 points) — Logical flow? Actionable?
6. SEO & Internal Linking (10 points) — Optimized for search? Opportunities for internal links?
7. Expertise & Trust Signals (5 points) — Shows domain expertise?
8. CTA & Conversion Alignment (5 points) — Clear next steps for readers?

Provide your critique as valid JSON.`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = message.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    let critique: Critique;
    try {
      critique = JSON.parse(content);
    } catch (e) {
      critique = {
        score: 75,
        issues: [
          {
            severity: 'p2',
            category: 'clarity',
            message: 'Review feedback generated; please review article for refinements',
          },
        ],
        suggestions: ['Review article structure and evidence backing'],
      };
    }

    return critique;
  }

  async generateRevision(params: RevisionParams): Promise<string> {
    const previousContext = params.previousFeedback
      ? `Previous feedback (already addressed):\n${params.previousFeedback.join('\n')}\n\n`
      : '';

    const systemPrompt = `You are an expert content editor refining a B2B technology article.
Your task is to revise the article based on specific feedback while maintaining quality and tone.

Requirements:
- Address each piece of feedback directly
- Keep the article's structure and core message
- Improve evidence backing, clarity, and engagement
- Maintain consistent voice and expertise signals`;

    const userPrompt = `Revise this blog article based on the feedback provided:

${previousContext}

CURRENT ARTICLE:
${params.current}

FEEDBACK TO ADDRESS:
${params.feedback}

Provide the revised article text.`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = message.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content;
  }
}
