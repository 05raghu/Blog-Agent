// Google Search scraper — crawls Google for demand signals
// Respects rate limiting with delays between requests

import { SearchDemandProvider, SearchDemandParams, SearchDemandResult } from './index';

export class GoogleSearchDemand implements SearchDemandProvider {
  private readonly baseDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  async getSearchDemand(params: SearchDemandParams): Promise<SearchDemandResult> {
    const { topic, keywords = [] } = params;
    const signals: string[] = [];

    try {
      console.log('[SearchDemand] Fetching demand data for:', topic);

      // Rate limiting: wait if needed
      await this.respectRateLimit();

      // 1. Get main search results for topic
      const mainSearch = await this.scrapeGoogleSearch(topic);
      signals.push(`Found ~${mainSearch.resultCount} search results`);

      // 2. Get related searches (Google Suggest)
      const relatedKeywords = await this.getRelatedSearches(topic);

      // 3. Calculate demand level based on signals
      const demandLevel = this.calculateDemandLevel(mainSearch.resultCount);

      // 4. Estimate monthly searches from result count
      const estimatedMonthlySearches = this.estimateSearchVolume(mainSearch.resultCount);

      // 5. Check if trending (simple heuristic)
      const trending = relatedKeywords.length > 5; // if many related searches, it's active

      if (demandLevel === 'high') signals.push('High search result volume');
      if (demandLevel === 'medium') signals.push('Moderate search interest');
      if (trending) signals.push('Trending topic (many related searches)');

      return {
        estimatedMonthlySearches,
        demandLevel,
        resultCount: mainSearch.resultCount,
        relatedKeywords: relatedKeywords.slice(0, 8), // top 8 related searches
        ranking: null, // would need domain config to check
        trending,
        confidence: 65, // moderate confidence from scraping
        signals,
      };
    } catch (error) {
      console.error('[SearchDemand] Error:', error);

      // Fallback: low-confidence guess based on topic
      return {
        estimatedMonthlySearches: 500,
        demandLevel: 'low',
        resultCount: 0,
        relatedKeywords: [],
        ranking: null,
        trending: false,
        confidence: 20,
        signals: ['Error fetching data, returning default estimate'],
      };
    }
  }

  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.baseDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.baseDelay - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  private async scrapeGoogleSearch(
    query: string
  ): Promise<{ resultCount: number; pageTitle: string }> {
    try {
      // Use a user-agent to avoid blocks
      const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

      const url = new URL('https://www.google.com/search');
      url.searchParams.set('q', query);

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        // Some environments may block fetch; wrap in try/catch
      });

      if (!response.ok) {
        console.warn('[SearchDemand] Google request failed:', response.status);
        return { resultCount: 0, pageTitle: '' };
      }

      const html = await response.text();

      // Extract result count from Google's HTML
      // Google shows: "About 123,456,789 results"
      const resultMatch = html.match(
        /About ([\d,]+)\s*result/i
      );
      let resultCount = 0;

      if (resultMatch) {
        resultCount = parseInt(resultMatch[1].replace(/,/g, ''), 10);
      }

      // Fallback: estimate from typical Google response patterns
      if (resultCount === 0) {
        // If we got HTML but couldn't parse count, it's likely a real result
        // Conservative estimate based on presence of results
        resultCount = html.includes('search result') ? 50000 : 0;
      }

      return { resultCount, pageTitle: '' };
    } catch (error) {
      console.warn('[SearchDemand] Scrape error:', error);
      return { resultCount: 0, pageTitle: '' };
    }
  }

  private async getRelatedSearches(query: string): Promise<string[]> {
    try {
      // Google Suggest endpoint (used by search bar autocomplete)
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(
          query
        )}`
      );

      if (!response.ok) {
        return [];
      }

      // Response is JSONP: ["query", ["suggestion1", "suggestion2", ...]]
      const text = await response.text();

      // Parse JSONP response
      const match = text.match(/\[\s*"[^"]*",\s*\[(.*?)\]\s*\]/);
      if (!match) {
        return [];
      }

      // Extract quoted strings from the array
      const suggestions: string[] = [];
      const suggestionText = match[1];
      const suggestionMatches = suggestionText.match(/"([^"]*)"/g);

      if (suggestionMatches) {
        suggestionMatches.forEach((s) => {
          const clean = s.replace(/"/g, '');
          if (clean && clean !== query) {
            suggestions.push(clean);
          }
        });
      }

      return suggestions.slice(0, 10); // top 10
    } catch (error) {
      console.warn('[SearchDemand] Related searches error:', error);
      return [];
    }
  }

  private calculateDemandLevel(resultCount: number): 'high' | 'medium' | 'low' {
    // Heuristic based on Google result count
    // High demand: 1M+ results
    // Medium demand: 100K - 1M results
    // Low demand: < 100K results
    if (resultCount >= 1000000) return 'high';
    if (resultCount >= 100000) return 'medium';
    return 'low';
  }

  private estimateSearchVolume(resultCount: number): number {
    // Very rough estimate: more results ≈ more searches
    // Google result count is a weak proxy for search volume
    // Actual volumes would come from Keyword Planner (paid)
    // This is a heuristic for comparison purposes only

    if (resultCount === 0) return 100; // no data
    if (resultCount < 10000) return 500;
    if (resultCount < 100000) return 5000;
    if (resultCount < 1000000) return 50000;
    return 100000; // high volume
  }
}
