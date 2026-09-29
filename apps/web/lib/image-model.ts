// Centralized image model provider — configure once, use everywhere
// Automatically switches between OpenAI DALL-E, Anthropic (mock), or Mock based on env vars

import { ImageModelProvider } from '@blog-agent/integrations';

let cachedProvider: ImageModelProvider | null = null;

export async function getImageModelProvider(): Promise<ImageModelProvider> {
  console.log('[getImageModelProvider] Checking for cached provider...');
  if (cachedProvider) {
    console.log('[getImageModelProvider] ✓ Using cached provider:', cachedProvider.constructor.name);
    return cachedProvider;
  }

  console.log('[getImageModelProvider] No cached provider, checking env vars...');
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  console.log('[getImageModelProvider] OPENAI_API_KEY:', openaiKey ? `present (${openaiKey.length} chars)` : 'NOT SET');
  console.log('[getImageModelProvider] ANTHROPIC_API_KEY:', anthropicKey ? `present (${anthropicKey.length} chars)` : 'NOT SET');

  // Priority: OpenAI (DALL-E) > Anthropic (mock, since Claude can't generate images) > Mock
  if (openaiKey) {
    console.log('[getImageModelProvider] ✓ Using OpenAI DALL-E 3');
    const { OpenAIImageModel } = await import('@blog-agent/integrations');
    cachedProvider = new OpenAIImageModel(openaiKey);
  } else if (anthropicKey) {
    console.log('[getImageModelProvider] ✓ Using Anthropic fallback (mock mode)');
    const { AnthropicImageModel } = await import('@blog-agent/integrations');
    cachedProvider = new AnthropicImageModel();
  } else {
    console.log('[getImageModelProvider] ✓ Using Mock implementation (demo mode)');
    const { MockImageModel } = await import('@blog-agent/integrations');
    cachedProvider = new MockImageModel();
  }

  console.log('[getImageModelProvider] ✓ Provider created:', cachedProvider.constructor.name);
  return cachedProvider;
}
