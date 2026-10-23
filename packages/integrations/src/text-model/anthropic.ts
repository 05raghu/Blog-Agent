// Live Anthropic TextModel implementation — uses Claude API for generation

import Anthropic from '@anthropic-ai/sdk';
import { TextModelProvider, BriefParams, OutlineParams, DraftParams, Critique, CritiqueParams, RevisionParams, SEOAnalysisParams, SEOAnalysisResult, LinkSuggestionParams, LinkSuggestion, CTAParams, CTAResult, TopicGenerationParams, GeneratedTopicCandidate, CraftImagePromptParams } from './index';
import { buildBrandSystemPrompt } from '../image-model/brand-guide';

export class AnthropicTextModel implements TextModelProvider {
  private client: Anthropic;
  private model = 'claude-haiku-4-5-20251001'; // Haiku 4.5 for faster, cost-effective generation

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
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

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
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

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
  }

  async generateDraft(params: DraftParams): Promise<string> {
    const systemPrompt = `You are an expert content strategist and writer for B2B technology companies.
Your task is to generate compelling, evidence-backed blog articles grounded in real expertise.

${params.voiceProfile ? `Brand Voice Guidelines:\n${params.voiceProfile}\n` : ''}

Requirements:
- Write for a professional, decision-maker audience
- Use specific data points and real-world examples from the SME insights when provided
- Avoid marketing clichés and false certainty
- Include actionable insights and next steps
- Ground positions and recommendations in the SME's expertise
- Target length: ${params.targetLength || 2000} words`;

    // Format SME insights for the prompt
    let insightsSection = '';
    if (params.briefingInsights) {
      const insights = params.briefingInsights;
      const sections: string[] = [];

      if (insights.positions && insights.positions.length > 0) {
        sections.push(`SME Positions (use to strengthen opening/thesis):\n${insights.positions.map(p => `- ${p.answer}`).join('\n')}`);
      }

      if (insights.examples && insights.examples.length > 0) {
        sections.push(`Real-World Examples (weave into body sections):\n${insights.examples.map(e => `- ${e.answer}`).join('\n')}`);
      }

      if (insights.recommendations && insights.recommendations.length > 0) {
        sections.push(`SME Recommendations (emphasize in actionable sections):\n${insights.recommendations.map(r => `- ${r.answer}`).join('\n')}`);
      }

      if (insights.caveats && insights.caveats.length > 0) {
        sections.push(`Important Caveats (include for balance and credibility):\n${insights.caveats.map(c => `- ${c.answer}`).join('\n')}`);
      }

      if (insights.quotable && insights.quotable.length > 0) {
        sections.push(`Quotable Insights (consider direct attribution):\n${insights.quotable.filter(q => q.quotability === 'high').map(q => `- "${q.answer}"`).join('\n')}`);
      }

      if (sections.length > 0) {
        insightsSection = `\nSME BRIEFING INSIGHTS:\n${sections.join('\n\n')}\n`;
      }
    }

    // Format reviewer feedback if provided
    let feedbackSection = '';
    if (params.reviewerFeedback && params.reviewerFeedback.length > 0) {
      const blockers = params.reviewerFeedback.filter(f => f.type === 'blocker');
      const suggestions = params.reviewerFeedback.filter(f => f.type === 'suggestion');

      feedbackSection = `\nREVIEWER FEEDBACK (address these points in your regeneration):\n`;

      if (blockers.length > 0) {
        feedbackSection += `\nBlockers (must fix):\n${blockers.map(b => `- ${b.section ? `[${b.section}]` : ''} ${b.content}`).join('\n')}\n`;
      }

      if (suggestions.length > 0) {
        feedbackSection += `\nSuggestions (incorporate where relevant):\n${suggestions.map(s => `- ${s.section ? `[${s.section}]` : ''} ${s.content}`).join('\n')}\n`;
      }
    }

    let userPrompt = '';
    if (params.reviewerFeedback && params.reviewerFeedback.length > 0) {
      // Feedback-driven regeneration
      userPrompt = `You are regenerating a blog article based on reviewer feedback.

Current article content:
${params.currentContent || 'No current content provided'}

Title: ${params.title}
Brief: ${params.brief}
Outline: ${params.outline}
${feedbackSection}
${insightsSection}

Instructions for regeneration:
1. Analyze the reviewer feedback carefully
2. If feedback mentions specific sections or is targeted to particular parts of the article, preserve the overall structure and focus your improvements on those sections
3. If the feedback is generic/holistic (about the entire article, tone, flow, etc.), feel free to regenerate the entire article comprehensively
4. Address all blockers - these are non-negotiable
5. Incorporate suggestions where they improve the article
6. Maintain the same structure (outline) unless the feedback explicitly suggests restructuring
7. Keep the SME insights and voice guidelines in mind

Generate the improved article incorporating the feedback.`;
    } else {
      // Initial draft generation
      userPrompt = `Generate a blog article based on this brief and outline:

BRIEF:
${params.brief}

OUTLINE:
${params.outline}
${insightsSection}
Write a complete, publish-ready draft article that weaves the SME insights naturally throughout to add credibility and specificity.`;
    }

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
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

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    let critique: Critique;
    try {
      critique = JSON.parse(content.text);
    } catch (e) {
      // Fallback if Claude's response isn't valid JSON
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

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
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

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let analysis: SEOAnalysisResult;
    try {
      analysis = JSON.parse(content.text);
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

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let suggestions: LinkSuggestion[] = [];
    try {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
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

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let result: CTAResult;
    try {
      result = JSON.parse(content.text);
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

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return [];
    }

    let parsed: unknown = [];
    try {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
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

  async craftBrandedImagePrompt(params: CraftImagePromptParams): Promise<string> {
    const systemPrompt = buildBrandSystemPrompt(params.behavior);

    const userPrompt = `Article Title: ${params.title}

Raw Topic/Context: ${params.topicContext}

Generate ONE polished, ready-to-use image generation prompt that follows the Codewave brand system recipe for the ${params.behavior} quantum behavior.`;

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text.trim();
  }
}
