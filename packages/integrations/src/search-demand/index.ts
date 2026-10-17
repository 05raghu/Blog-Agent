// Search demand provider — crawls Google Search for topic demand signals

export interface SearchDemandParams {
  topic: string;
  keywords?: string[];
}

export interface SearchDemandResult {
  estimatedMonthlySearches: number; // estimated from result count + signals
  demandLevel: 'high' | 'medium' | 'low'; // based on search signals
  resultCount: number; // approximate Google result count
  relatedKeywords: string[]; // top related searches
  ranking: number | null; // your domain ranking (if found), null if not ranked
  trending: boolean; // is this topic trending up?
  confidence: number; // 0-100, confidence in this data
  signals: string[]; // explanation of how demand was calculated
}

export interface SearchDemandProvider {
  getSearchDemand(params: SearchDemandParams): Promise<SearchDemandResult>;
}
