// Text model provider interface — Anthropic Claude + OpenAI + mock

export interface TextModelProvider {
  generateBrief(params: BriefParams): Promise<string>;
  generateOutline(params: OutlineParams): Promise<string>;
  generateDraft(params: DraftParams): Promise<string>;
  generateCritique(params: CritiqueParams): Promise<Critique>;
  generateRevision(params: RevisionParams): Promise<string>;
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

// Re-exports for module resolution
import { AnthropicTextModel } from './anthropic';
import { OpenAITextModel } from './openai';
import { MockTextModel } from './mock';

export { AnthropicTextModel };
export { OpenAITextModel };
export { MockTextModel };
