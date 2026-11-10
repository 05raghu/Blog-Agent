// Centralized SERP provider — uses Serper.dev if SERP_API_KEY is set, else Mock

import { SerpProvider } from '@blog-agent/integrations';

let cachedProvider: SerpProvider | null = null;

export async function getSerpProvider(): Promise<SerpProvider> {
  if (cachedProvider) {
    return cachedProvider;
  }

  const serperKey = process.env.SERP_API_KEY;

  if (serperKey) {
    console.log('[SERP] Using Serper.dev for real Google search signal');
    const { SerperProvider } = await import('@blog-agent/integrations');
    cachedProvider = new SerperProvider(serperKey);
  } else {
    console.log('[SERP] No SERP_API_KEY set — using Mock implementation (demo mode)');
    const { MockSerpProvider } = await import('@blog-agent/integrations');
    cachedProvider = new MockSerpProvider();
  }

  return cachedProvider;
}
