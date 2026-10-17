// Mock search demand provider for testing (deterministic, no network calls)

import { SearchDemandProvider, SearchDemandParams, SearchDemandResult } from './index';

export class MockSearchDemand implements SearchDemandProvider {
  async getSearchDemand(params: SearchDemandParams): Promise<SearchDemandResult> {
    const { topic } = params;

    // Deterministic hash-based scoring
    const hash = this.simpleHash(topic);
    const demandLevel = hash % 3 === 0 ? 'high' : hash % 3 === 1 ? 'medium' : 'low';
    const baseSearchVolume =
      demandLevel === 'high' ? 50000 : demandLevel === 'medium' ? 5000 : 500;
    const resultCount =
      demandLevel === 'high' ? 5000000 : demandLevel === 'medium' ? 500000 : 50000;

    const trendingKeywords = this.generateRelatedKeywords(topic);

    return {
      estimatedMonthlySearches: baseSearchVolume + (hash % 10000),
      demandLevel,
      resultCount,
      relatedKeywords: trendingKeywords,
      ranking: null,
      trending: demandLevel !== 'low',
      confidence: 60,
      signals: [
        `~${resultCount.toLocaleString()} search results`,
        `Estimated ${baseSearchVolume.toLocaleString()} monthly searches`,
        demandLevel === 'high' ? 'High demand topic' : 'Moderate interest',
      ],
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private generateRelatedKeywords(topic: string): string[] {
    const baseKeywords = topic.split(' ');

    // Common modifier keywords
    const modifiers = ['how to', 'best practices for', 'guide to', 'tutorial on', 'tips for'];

    return [
      `${modifiers[Math.floor(Math.random() * modifiers.length)]} ${topic}`,
      `${topic} guide`,
      `${topic} tutorial`,
      `${topic} examples`,
      `${baseKeywords[0]} vs ${baseKeywords[Math.min(1, baseKeywords.length - 1)]}`,
      `advanced ${topic}`,
      `${topic} mistakes`,
      `${topic} trends 2026`,
    ];
  }
}
