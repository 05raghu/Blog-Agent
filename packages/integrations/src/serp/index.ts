// SERP provider interface — real-time Google search signal for trend evidence

export interface SerpOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerpNewsResult {
  title: string;
  link: string;
  snippet: string;
  date: string; // raw date string as returned by provider, e.g. "2 days ago" or ISO
  source: string;
}

export interface SerpSearchResponse {
  organic: SerpOrganicResult[];
  relatedSearches: string[];
  peopleAlsoAsk: string[];
}

export interface SerpProvider {
  search(query: string): Promise<SerpSearchResponse>;
  searchSite(query: string, site: string): Promise<SerpSearchResponse>;
  searchNews(query: string): Promise<SerpNewsResult[]>;
}

export interface TrendEvidenceLink {
  title: string;
  link: string;
}

export interface TrendEvidenceNewsLink extends TrendEvidenceLink {
  date: string;
  source: string;
}

export interface TrendEvidence {
  topic: string;
  linkedinPostCount: number;
  recentArticleCount: number; // verified news coverage from the last ~60 days (Google News, has reliable dates)
  webArticleCount: number; // blogs/articles found via general web search (Google doesn't reliably expose dates here, so no recency claim is made)
  topSources: string[]; // distinct domains/publishers seen across all three queries
  isTrending: boolean;
  reasoning: string; // human-readable summary, e.g. "15+ LinkedIn posts found..."
  fetchedAt: string;
  // Actual citable links behind each count, so the evidence can be verified, not just trusted
  linkedinPostLinks: TrendEvidenceLink[];
  webArticleLinks: TrendEvidenceLink[];
  newsArticleLinks: TrendEvidenceNewsLink[];
}

export { SerperProvider } from './serper';
export { MockSerpProvider } from './mock';
