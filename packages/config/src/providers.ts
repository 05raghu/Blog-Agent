// Provider factory — resolves integrations based on env config
// Switches between mock and live implementations at runtime

import type { TextModelProvider } from '@blog-agent/integrations';
import { getEnv } from './env';

let cachedTextModelProvider: TextModelProvider | null = null;

export async function getTextModelProvider(): Promise<TextModelProvider> {
  if (cachedTextModelProvider) {
    return cachedTextModelProvider;
  }

  const env = getEnv();

  // Auto-detect: use live API if key is present, otherwise use mock
  if (env.OPENAI_API_KEY) {
    console.log('[TextModel] Using live OpenAI GPT API');
    const { OpenAITextModel } = await import('@blog-agent/integrations');
    cachedTextModelProvider = new OpenAITextModel(env.OPENAI_API_KEY);
  } else if (env.ANTHROPIC_API_KEY) {
    console.log('[TextModel] Using live Anthropic Claude API');
    const { AnthropicTextModel } = await import('@blog-agent/integrations');
    cachedTextModelProvider = new AnthropicTextModel(env.ANTHROPIC_API_KEY);
  } else if (env.TEXT_MODEL_MODE === 'live') {
    throw new Error(
      'TEXT_MODEL_MODE=live but neither OPENAI_API_KEY nor ANTHROPIC_API_KEY is set. Either provide an API key or remove the TEXT_MODEL_MODE setting.'
    );
  } else {
    console.log('[TextModel] Using mock implementation (demo mode)');
    const { MockTextModel } = await import('@blog-agent/integrations');
    cachedTextModelProvider = new MockTextModel();
  }

  return cachedTextModelProvider;
}

// TODO: Add other provider factories as they're implemented
// export function getImageModelProvider() { ... }
// export function getWordPressClient() { ... }
// export function getAnalyticsProvider() { ... }
