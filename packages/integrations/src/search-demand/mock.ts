// Mock search demand provider — deterministic demo data from GA4 + GSC

import { SearchDemandProvider, SearchDemandParams, SearchDemandResult } from './index';

export class MockSearchDemand implements SearchDemandProvider {
  async getSearchDemand(params: SearchDemandParams): Promise<SearchDemandResult> {
    const { topic } = params;

    // Deterministic hash-based scoring
    const hash = this.simpleHash(topic);
    const demandLevel = hash % 3 === 0 ? 'high' : hash % 3 === 1 ? 'medium' : 'low';

    // Simulate GSC data
    const gscImpressions =
      demandLevel === 'high' ? 50000 : demandLevel === 'medium' ? 5000 : 500;
    const gscClicks = Math.round(gscImpressions * (0.03 + Math.random() * 0.05)); // 3-8% CTR
    const gscAveragePosition =
      demandLevel === 'high' ? 3 : demandLevel === 'medium' ? 8 : 15;

    // Simulate GA4 data (traffic on similar articles)
    const ga4TrafficOnSimilar =
      demandLevel === 'high' ? 5000 : demandLevel === 'medium' ? 500 : 50;

    const estimatedMonthlySearches = gscImpressions + ga4TrafficOnSimilar;

    return {
      estimatedMonthlySearches,
      demandLevel,
      gscImpressions,
      gscClicks,
      gscAveragePosition,
      ga4TrafficOnSimilar,
      trending: demandLevel !== 'low' && Math.random() > 0.5,
      confidence: 70,
      signals: [
        `GSC: ${gscImpressions.toLocaleString()} impressions, ${gscClicks} clicks`,
        `GA4: ${ga4TrafficOnSimilar.toLocaleString()} pageviews on similar content`,
        `Avg ranking position: #${gscAveragePosition}`,
        demandLevel === 'high'
          ? 'Strong demand signals'
          : demandLevel === 'medium'
            ? 'Moderate demand'
            : 'Low search interest',
      ],
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
