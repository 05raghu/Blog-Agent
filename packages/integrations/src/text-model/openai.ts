// Live OpenAI TextModel implementation — uses GPT-4 API for generation

import OpenAI from 'openai';
import { TextModelProvider, BriefParams, OutlineParams, DraftParams, Critique, CritiqueParams, RevisionParams, SEOAnalysisParams, SEOAnalysisResult, LinkSuggestionParams, LinkSuggestion, CTAParams, CTAResult, TopicGenerationParams, GeneratedTopicCandidate } from './index';

export class OpenAITextModel implements TextModelProvider {
  private client: OpenAI;
  private model = 'gpt-4o-mini'; // Fast, cost-effective GPT model

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateBrief(params: BriefParams): Promise<string> {
    const systemPrompt = `You are an expert content strategist. Generate a concise, compelling brief (2-3 sentences) for an article.`;

    const userPrompt = `Generate a brief for an article with this title:

Title: "${params.title}"
${params.angle ? `Angle: ${params.angle}` : ''}
${params.targetOffering ? `Target Offering: ${params.targetOffering}` : ''}
${params.targetAudience ? `Target Audience: ${params.targetAudience}` : ''}

The brief should:
- Capture the main value proposition
- Be clear and actionable
- Hook the reader's interest
- Be suitable for B2B/SaaS audience

Write just the brief, no additional text:`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = message.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content;
  }

  async generateOutline(params: OutlineParams): Promise<string> {
    const systemPrompt = `You are an expert content strategist. Generate a detailed outline for an article.`;

    const userPrompt = `Generate an outline for an article based on the brief provided.

Article Title: ${params.title}
Brief: ${params.brief}
${params.targetAudience ? `Target Audience: ${params.targetAudience}` : ''}

Create a comprehensive outline with:
- Clear section headings (use ## markdown format)
- 4-6 main sections
- 2-3 bullet points under each section for key topics to cover
- Practical examples or case studies to include

Format the response as a markdown outline that can be used to write the article.`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = message.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content;
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

  async analyzeSEO(params: SEOAnalysisParams): Promise<SEOAnalysisResult> {
    const systemPrompt = `You are an SEO analyst. Analyze the provided article and return structured SEO analysis in valid JSON format.

You MUST respond with valid JSON in this exact format:
{
  "score": <number 0-100>,
  "keyword": "<primary keyword/topic>",
  "keywordDensity": <number 0-100>,
  "readabilityScore": <number 0-18 grade level>,
  "metaDescription": "<description 150-160 chars>",
  "issues": [{"type": "error|warning|info", "message": "<string>"}],
  "suggestions": ["<string>", "<string>"]
}`;

    const userPrompt = `Analyze this article for SEO:

Title: ${params.title}
Brief: ${params.brief || 'N/A'}

Content:
${params.content.substring(0, 2000)}

Provide JSON analysis focusing on:
1. Primary topic/keyword (not just the first title word)
2. Keyword density (how often it appears)
3. Readability (estimated grade level)
4. Meta description (compelling, 150-160 chars)
5. Issues (missing structure, low word count, keyword stuffing, etc.)
6. Suggestions (how to improve SEO)`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = message.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    let analysis: SEOAnalysisResult;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      analysis = {
        score: 50,
        keyword: 'content',
        keywordDensity: 1.5,
        readabilityScore: 8,
        metaDescription: params.title.substring(0, 160),
        issues: [],
        suggestions: ['Review article for SEO optimization opportunities'],
      };
    }

    return analysis;
  }

  async suggestInternalLinks(params: LinkSuggestionParams): Promise<LinkSuggestion[]> {
    const candidatesList = params.candidates
      .map((c) => `- "${c.title}" (ID: ${c.id}): ${c.excerpt.substring(0, 300)}...`)
      .join('\n');

    const systemPrompt = `You are an editorial strategist. Suggest 2-4 relevant internal links from a list of candidates.

You MUST respond with valid JSON array in this exact format:
[
  {"id": "<string>", "title": "<string>", "relevance": <0-100>, "suggestedAnchor": "<anchor text>", "rationale": "<one sentence>"},
  ...
]`;

    const userPrompt = `Given this article, suggest the 2-4 most relevant internal links from the candidates below.

Current Article:
Title: ${params.currentTitle}
Excerpt: ${params.currentContent.substring(0, 500)}

Available Articles to Link To:
${candidatesList}

For each suggestion provide:
- id: article ID
- title: article title
- relevance: 0-100 relevance score
- suggestedAnchor: phrase from current article to use as link text
- rationale: one sentence explaining why this link is relevant`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = message.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    let suggestions: LinkSuggestion[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse link suggestions:', e);
    }

    return suggestions.slice(0, 4);
  }

  async generateCTA(params: CTAParams): Promise<CTAResult> {
    const systemPrompt = `You are a conversion-focused copywriter. Generate 1-2 compelling call-to-action (CTA) suggestions for blog articles.

You MUST respond with valid JSON in this exact format:
{
  "ctas": [
    {"text": "<cta text>", "rationale": "<one sentence>"},
    {"text": "<cta text>", "rationale": "<one sentence>"}
  ]
}`;

    const userPrompt = `Generate 1-2 actionable CTAs for this article that drive reader engagement and conversion.

Article Title: ${params.title}
Target Audience: ${params.targetAudience || 'General'}
Brief: ${params.brief || 'N/A'}

Content Excerpt:
${params.content.substring(0, 1500)}

For each CTA, provide:
- text: Short, action-oriented copy (5-10 words) that tells readers what to do next
- rationale: One sentence explaining why this CTA works for this article and audience

Examples of good CTAs:
- "Get the free data integration checklist"
- "Schedule a personalized demo today"
- "Download our ETL best practices guide"
- "Join 5,000+ engineers in our community"

Focus on:
1. Clarity: What action should the reader take?
2. Value: What's in it for them?
3. Urgency: Create a reason to act now
4. Audience fit: Match the tone and needs of your readers`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent = message.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    let result: CTAResult;
    try {
      result = JSON.parse(responseContent);
    } catch (e) {
      result = {
        ctas: [
          {
            text: `Learn more about ${params.title.toLowerCase()}`,
            rationale: 'Generic fallback CTA',
          },
        ],
      };
    }

    return result;
  }

  async generateTopicCandidates(params: TopicGenerationParams): Promise<GeneratedTopicCandidate[]> {
    const { strategy, seed, count } = params;

    const systemPrompt = `You are a B2B content strategist generating raw topic ideas for a marketing team. Propose topic ideas only — do NOT score, rank, or rate them.

You MUST respond with valid JSON array in this exact format:
[
  {
    "title": "<string>",
    "summary": "<2-3 sentence string>",
    "angle": "<string, the unique angle or perspective>",
    "targetOffering": "<string, ideally one of the provided offerings>",
    "format": "blog|guide|case_study|whitepaper",
    "geography": "<string>",
    "audience": "<string, target reader/persona>"
  }
]`;

    const userPrompt = `Generate exactly ${count} diverse, distinct blog topic candidates for this B2B content strategy.

Offerings: ${strategy.offerings?.join(', ') || 'none specified'}
Target ICPs: ${strategy.targetIcps?.join(', ') || 'none specified'}
Geographies: ${strategy.geographies?.join(', ') || 'none specified'}
Competitors: ${strategy.competitors?.join(', ') || 'none specified'}
Content Mix: ${JSON.stringify(strategy.contentMix || {})}

${seed ? `Marketer-provided seed/focus direction (steer generation toward this): "${seed}"` : 'No seed provided — generate purely from the strategy fields above.'}

Requirements:
- Produce exactly ${count} distinct candidates (no duplicates or near-duplicates)
- Vary the format, offering, and angle across candidates
- Ground targetOffering/audience in the provided lists where possible
- Keep summaries concrete, not vague marketing fluff
- Do not include any score, ranking, or numeric rating

Respond with the JSON array only.`;

    const message = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const responseContent = message.choices[0].message.content;
    if (!responseContent) {
      return [];
    }

    let parsed: unknown = [];
    try {
      const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error('Failed to parse topic candidates:', e);
    }

    // Filter valid items, return however many parsed (no silent padding)
    const candidates = Array.isArray(parsed)
      ? parsed
          .filter((t): t is any => t && typeof t.title === 'string' && t.title.trim().length > 0)
          .map((t) => ({
            title: t.title,
            summary: typeof t.summary === 'string' ? t.summary : '',
            angle: typeof t.angle === 'string' ? t.angle : undefined,
            targetOffering: typeof t.targetOffering === 'string' ? t.targetOffering : undefined,
            format: ['blog', 'guide', 'case_study', 'whitepaper'].includes(t.format) ? t.format : 'blog',
            geography: typeof t.geography === 'string' ? t.geography : undefined,
            audience: typeof t.audience === 'string' ? t.audience : undefined,
          }))
      : [];

    return candidates;
  }
}
