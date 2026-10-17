// Search demand provider — auto-selects between Google scrape and mock

import { GoogleSearchDemand } from '@blog-agent/integrations/search-demand/google-scrape';
import { MockSearchDemand } from '@blog-agent/integrations/search-demand/mock';
import type { SearchDemandProvider } from '@blog-agent/integrations/search-demand';

let searchDemandProvider: SearchDemandProvider | null = null;

export async function getSearchDemandProvider(): Promise<SearchDemandProvider> {
  if (searchDemandProvider) {
    return searchDemandProvider;
  }

  // For now, use mock (Google scraping may be blocked in some environments)
  // To enable real Google scraping, set USE_GOOGLE_SCRAPE=true in .env.local
  const useGoogleScrape = process.env.USE_GOOGLE_SCRAPE === 'true';

  if (useGoogleScrape) {
    console.log('[SearchDemand] Using Google Search scraper');
    searchDemandProvider = new GoogleSearchDemand();
  } else {
    console.log('[SearchDemand] Using mock search demand provider');
    searchDemandProvider = new MockSearchDemand();
  }

  return searchDemandProvider;
}
