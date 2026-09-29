// Text model provider interface — Anthropic Claude + OpenAI + mock

export interface TextModelProvider {
  generateBrief(params: BriefParams): Promise<string>;
  generateOutline(params: OutlineParams): Promise<string>;
  generateDraft(params: DraftParams): Promise<string>;
  generateCritique(params: CritiqueParams): Promise<Critique>;
  generateRevision(params: RevisionParams): Promise<string>;
  analyzeSEO(params: SEOAnalysisParams): Promise<SEOAnalysisResult>;
  suggestInternalLinks(params: LinkSuggestionParams): Promise<LinkSuggestion[]>;
  generateCTA(params: CTAParams): Promise<CTAResult>;
  generateTopicCandidates(params: TopicGenerationParams): Promise<GeneratedTopicCandidate[]>;
}

export interface BriefParams {
  title: string;
  angle?: string;
  targetOffering?: string;
  targetAudience?: string;
}

export interface OutlineParams {
  title: string;
  brief: string;
  targetAudience?: string;
}

export interface DraftParams {
  title: string;
  brief: string;
  outline: string;
  voiceProfile?: string;
  targetAudience?: string;
  targetLength?: number;
}

export interface Critique {
  score: number; // 0-100
  issues: CritiqueIssue[];
  suggestions: string[];
}

export interface CritiqueIssue {
  severity: 'p0' | 'p1' | 'p2' | 'p3';
  category: 'evidence' | 'clarity' | 'brand' | 'engagement';
  message: string;
  position?: number;
}

export interface CritiqueParams {
  current: string;
}

export interface RevisionParams {
  current: string;
  feedback: string;
  previousFeedback?: string[];
}

export interface SEOAnalysisParams {
  title: string;
  content: string;
  brief?: string;
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export interface SEOAnalysisResult {
  score: number;
  keyword: string;
  keywordDensity: number;
  readabilityScore: number;
  metaDescription: string;
  issues: SEOIssue[];
  suggestions: string[];
}

export interface LinkSuggestionCandidate {
  id: string;
  title: string;
  excerpt: string; // ~300 chars of content
}

export interface LinkSuggestionParams {
  currentTitle: string;
  currentContent: string;
  candidates: LinkSuggestionCandidate[];
}

export interface LinkSuggestion {
  id: string;
  title: string;
  relevance: number; // 0-100
  suggestedAnchor: string;
  rationale: string;
}

export interface CTAParams {
  title: string;
  content: string;
  brief?: string;
  targetAudience?: string;
}

export interface CTA {
  text: string;
  rationale: string;
}

export interface CTAResult {
  ctas: CTA[];
}

export interface TopicGenerationParams {
  strategy: {
    offerings: string[];
    targetIcps: string[];
    geographies: string[];
    competitors: string[];
    contentMix: Record<string, number>;
  };
  seed?: string;
  count: number;
}

export interface GeneratedTopicCandidate {
  title: string;
  summary: string;
  angle?: string;
  targetOffering?: string;
  format?: string;
  geography?: string;
  audience?: string;
}

// Re-exports for module resolution
import { AnthropicTextModel } from './anthropic';
import { OpenAITextModel } from './openai';
import { MockTextModel } from './mock';

export { AnthropicTextModel };
export { OpenAITextModel };
export { MockTextModel };
