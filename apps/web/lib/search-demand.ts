// Search demand provider — uses GA4 + GSC real data (mock during setup)

import { MockSearchDemand } from '@blog-agent/integrations/search-demand/mock';
import type { SearchDemandProvider } from '@blog-agent/integrations/search-demand';

let searchDemandProvider: SearchDemandProvider | null = null;

export async function getSearchDemandProvider(): Promise<SearchDemandProvider> {
  if (searchDemandProvider) {
    return searchDemandProvider;
  }

  // Currently using mock mode
  // After GA4 + GSC setup, this will switch to real implementations
  console.log('[SearchDemand] Using mock (setup GA4 + GSC for real data)');
  searchDemandProvider = new MockSearchDemand();

  return searchDemandProvider;
}
