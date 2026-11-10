// Real SERP provider — Serper.dev (Google Search API)

import { SerpProvider, SerpSearchResponse, SerpNewsResult } from './index';

export class SerperProvider implements SerpProvider {
  private apiKey: string;
  private baseUrl = 'https://google.serper.dev';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async post(path: string, body: Record<string, any>): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Serper API error (${response.status}): ${text.substring(0, 200)}`);
    }

    return response.json();
  }

  async search(query: string): Promise<SerpSearchResponse> {
    const data = await this.post('/search', { q: query, num: 10 });
    return this.parseSearchResponse(data);
  }

  async searchSite(query: string, site: string): Promise<SerpSearchResponse> {
    const data = await this.post('/search', { q: `site:${site} ${query}`, num: 10 });
    return this.parseSearchResponse(data);
  }

  async searchNews(query: string): Promise<SerpNewsResult[]> {
    const data = await this.post('/news', { q: query, num: 10 });
    const news = Array.isArray(data.news) ? data.news : [];
    return news.map((n: any) => ({
      title: n.title || '',
      link: n.link || '',
      snippet: n.snippet || '',
      date: n.date || '',
      source: n.source || '',
    }));
  }

  private parseSearchResponse(data: any): SerpSearchResponse {
    const organic = Array.isArray(data.organic) ? data.organic : [];
    const peopleAlsoAsk = Array.isArray(data.peopleAlsoAsk) ? data.peopleAlsoAsk : [];
    const relatedSearches = Array.isArray(data.relatedSearches) ? data.relatedSearches : [];

    return {
      organic: organic.map((o: any) => ({
        title: o.title || '',
        link: o.link || '',
        snippet: o.snippet || '',
        position: o.position || 0,
      })),
      peopleAlsoAsk: peopleAlsoAsk.map((p: any) => p.question || '').filter(Boolean),
      relatedSearches: relatedSearches.map((r: any) => r.query || '').filter(Boolean),
    };
  }
}
