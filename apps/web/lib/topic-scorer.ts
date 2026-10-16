// Centralized topic scorer provider — auto-selects OpenAI, Anthropic, or Mock

import { TopicScorerProvider } from '@blog-agent/integrations';

let cachedProvider: TopicScorerProvider | null = null;

export async function getTopicScorerProvider(): Promise<TopicScorerProvider> {
  if (cachedProvider) {
    return cachedProvider;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Priority: OpenAI > Anthropic > Mock
  if (openaiKey) {
    console.log('[TopicScorer] Using OpenAI GPT-4o-mini for LLM-based scoring');
    const { OpenAITopicScorer } = await import('@blog-agent/integrations');
    cachedProvider = new OpenAITopicScorer(openaiKey);
  } else if (anthropicKey) {
    console.log('[TopicScorer] Using Anthropic Claude Haiku for LLM-based scoring');
    const { AnthropicTopicScorer } = await import('@blog-agent/integrations');
    cachedProvider = new AnthropicTopicScorer(anthropicKey);
  } else {
    console.log('[TopicScorer] Using Mock implementation (demo mode)');
    const { MockTopicScorer } = await import('@blog-agent/integrations');
    cachedProvider = new MockTopicScorer();
  }

  return cachedProvider;
}
