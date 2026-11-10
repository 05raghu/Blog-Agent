// Mock SERP provider — deterministic fake results for testing/demo without an API key

import { SerpProvider, SerpSearchResponse, SerpNewsResult } from './index';

export class MockSerpProvider implements SerpProvider {
  async search(query: string): Promise<SerpSearchResponse> {
    return {
      organic: [
        { title: `${query}: A Complete Guide`, link: 'https://example.com/guide', snippet: `Everything you need to know about ${query}.`, position: 1 },
        { title: `${query} Best Practices`, link: 'https://medium.com/best-practices', snippet: `Industry best practices for ${query}.`, position: 2 },
        { title: `Why ${query} Matters in 2026`, link: 'https://hbr.org/article', snippet: `Analysis of ${query} trends.`, position: 3 },
      ],
      peopleAlsoAsk: [`What is ${query}?`, `How to improve ${query}?`, `Why is ${query} important?`],
      relatedSearches: [`${query} examples`, `${query} tips`, `${query} training`],
    };
  }

  async searchSite(query: string, site: string): Promise<SerpSearchResponse> {
    return {
      organic: [
        { title: `${query} — ${site} post`, link: `https://${site}/post1`, snippet: `Mock ${site} post about ${query}.`, position: 1 },
        { title: `${query} discussion — ${site}`, link: `https://${site}/post2`, snippet: `Mock ${site} discussion about ${query}.`, position: 2 },
      ],
      peopleAlsoAsk: [],
      relatedSearches: [],
    };
  }

  async searchNews(query: string): Promise<SerpNewsResult[]> {
    return [
      { title: `${query} in the news`, link: 'https://forbes.com/article', snippet: `Recent coverage of ${query}.`, date: '5 days ago', source: 'Forbes' },
      { title: `The future of ${query}`, link: 'https://techcrunch.com/article', snippet: `${query} trends analysis.`, date: '2 weeks ago', source: 'TechCrunch' },
    ];
  }
}
