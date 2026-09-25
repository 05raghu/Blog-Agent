// Centralized text model provider — configure once, use everywhere
// Automatically switches between OpenAI, Anthropic, or Mock based on env vars

import { TextModelProvider } from '@blog-agent/integrations';

let cachedProvider: TextModelProvider | null = null;

export async function getTextModelProvider(): Promise<TextModelProvider> {
  if (cachedProvider) {
    return cachedProvider;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Priority: OpenAI > Anthropic > Mock
  if (openaiKey) {
    console.log('[TextModel] Using OpenAI GPT-4o-mini');
    const { OpenAITextModel } = await import('@blog-agent/integrations');
    cachedProvider = new OpenAITextModel(openaiKey);
  } else if (anthropicKey) {
    console.log('[TextModel] Using Anthropic Claude Haiku 4.5');
    const { AnthropicTextModel } = await import('@blog-agent/integrations');
    cachedProvider = new AnthropicTextModel(anthropicKey);
  } else {
    console.log('[TextModel] Using Mock implementation (demo mode)');
    const { MockTextModel } = await import('@blog-agent/integrations');
    cachedProvider = new MockTextModel();
  }

  return cachedProvider;
}
