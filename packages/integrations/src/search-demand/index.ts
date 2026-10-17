// Search demand provider — uses real GA4 + GSC data to assess topic demand
// GA4: traffic to similar existing content
// GSC: Google search impressions & clicks for related keywords

export interface SearchDemandParams {
  topic: string;
  keywords?: string[];
}

export interface SearchDemandResult {
  estimatedMonthlySearches: number; // from GSC impressions + GA4 similar content traffic
  demandLevel: 'high' | 'medium' | 'low'; // based on real data signals
  gscImpressions: number; // total Google search impressions for related keywords
  gscClicks: number; // total clicks from Google search
  gscAveragePosition: number; // average ranking position
  ga4TrafficOnSimilar: number; // pageviews on similar existing content
  trending: boolean; // traffic trending up?
  confidence: number; // 0-100, confidence in this data (higher = more data available)
  signals: string[]; // explanation of how demand was calculated
}

export interface SearchDemandProvider {
  getSearchDemand(params: SearchDemandParams): Promise<SearchDemandResult>;
}
