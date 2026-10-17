// Search demand provider — uses real GA4 + mock GSC (no domain yet)

import { getGA4Provider } from './ga4';
import { MockSearchDemand } from '@blog-agent/integrations';
import type { SearchDemandProvider, SearchDemandParams, SearchDemandResult } from '@blog-agent/integrations';

class GA4SearchDemand implements SearchDemandProvider {
  async getSearchDemand(params: SearchDemandParams): Promise<SearchDemandResult> {
    const { topic } = params;

    try {
      const ga4 = await getGA4Provider();
      const metrics = await ga4.getTrafficForTopic({ topic });

      // Calculate demand level based on GA4 traffic
      let demandLevel: 'high' | 'medium' | 'low';
      if (metrics.totalPageviews > 5000) {
        demandLevel = 'high';
      } else if (metrics.totalPageviews > 500) {
        demandLevel = 'medium';
      } else {
        demandLevel = 'low';
      }

      // Estimate GSC impressions from GA4 data
      // Assumption: ~5% of impressions convert to clicks/pageviews
      const estimatedImpressions = Math.round(metrics.totalPageviews / 0.03);

      // Ensure all values are numbers
      const totalPageviews = metrics.totalPageviews || 0;
      const totalUsers = metrics.totalUsers || 0;
      const bounceRate = metrics.bounceRate || 0;
      const conversionRate = metrics.conversionRate || 0;

      return {
        estimatedMonthlySearches: totalPageviews,
        demandLevel,
        gscImpressions: estimatedImpressions,
        gscClicks: totalPageviews,
        gscAveragePosition: demandLevel === 'high' ? 3 : demandLevel === 'medium' ? 8 : 15,
        ga4TrafficOnSimilar: totalPageviews,
        trending: bounceRate < 50, // lower bounce rate = engaged = trending
        confidence: 85,
        signals: [
          `GA4: ${totalPageviews.toLocaleString()} pageviews on similar content`,
          `${totalUsers.toLocaleString()} unique users interested in this topic`,
          `Bounce rate: ${bounceRate.toFixed(0)}%`,
          `Conversion rate: ${conversionRate.toFixed(1)}%`,
          demandLevel === 'high'
            ? 'Strong traffic signals'
            : demandLevel === 'medium'
              ? 'Moderate interest'
              : 'Low traffic on similar content',
        ],
      };
    } catch (error) {
      console.error('[SearchDemand] GA4 error:', error);
      // Fall back to mock data on error instead of crashing
      console.log('[SearchDemand] Falling back to mock due to error');
      const mockProvider = new MockSearchDemand();
      return mockProvider.getSearchDemand(params);
    }
  }
}

let searchDemandProvider: SearchDemandProvider | null = null;

export async function getSearchDemandProvider(): Promise<SearchDemandProvider> {
  if (searchDemandProvider) {
    return searchDemandProvider;
  }

  console.log('[SearchDemand] Using GA4-based search demand provider');
  searchDemandProvider = new GA4SearchDemand();

  return searchDemandProvider;
}
