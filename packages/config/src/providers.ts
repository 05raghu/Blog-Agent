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

  if (env.TEXT_MODEL_MODE === 'live') {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error(
        'TEXT_MODEL_MODE=live but ANTHROPIC_API_KEY is not set. Either provide the API key or switch to mock mode.'
      );
    }
    console.log('[TextModel] Using live Anthropic Claude API');
    // Dynamic import to avoid build-time issues
    const { AnthropicTextModel } = await import('@blog-agent/integrations/text-model');
    cachedTextModelProvider = new AnthropicTextModel(env.ANTHROPIC_API_KEY);
  } else {
    console.log('[TextModel] Using mock implementation (demo mode)');
    // Dynamic import to avoid build-time issues
    const { MockTextModel } = await import('@blog-agent/integrations/text-model');
    cachedTextModelProvider = new MockTextModel();
  }

  return cachedTextModelProvider;
}

// TODO: Add other provider factories as they're implemented
// export function getImageModelProvider() { ... }
// export function getWordPressClient() { ... }
// export function getAnalyticsProvider() { ... }
