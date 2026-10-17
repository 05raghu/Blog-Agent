// Mock GA4 provider — deterministic demo data for testing

import { GA4Provider, GA4QueryParams, GA4Metrics } from './index';

export class MockGA4 implements GA4Provider {
  async getTrafficForTopic(params: GA4QueryParams): Promise<GA4Metrics> {
    const { topic } = params;

    // Deterministic hash-based scoring
    const hash = this.simpleHash(topic);
    const demandLevel = hash % 3 === 0 ? 'high' : hash % 3 === 1 ? 'medium' : 'low';

    // Simulate realistic GA4 metrics
    const totalUsers =
      demandLevel === 'high' ? 5000 + (hash % 5000) : demandLevel === 'medium' ? 500 + (hash % 500) : 50 + (hash % 50);
    const totalPageviews = Math.round(totalUsers * 1.5); // 1.5 pageviews per user
    const bounceRate = demandLevel === 'high' ? 35 : demandLevel === 'medium' ? 50 : 70;
    const conversionRate = demandLevel === 'high' ? 5 : demandLevel === 'medium' ? 2 : 0.5;

    return {
      totalUsers,
      totalPageviews,
      averageEngagementTime: demandLevel === 'high' ? 120 : demandLevel === 'medium' ? 45 : 15,
      eventCount: totalPageviews * 2, // 2 events per pageview
      bounceRate,
      conversionRate,
      topPages: [
        {
          pagePath: `/how-to-${topic.toLowerCase().replace(/\s+/g, '-')}`,
          users: Math.round(totalUsers * 0.4),
          pageviews: Math.round(totalPageviews * 0.4),
        },
        {
          pagePath: `/guide-${topic.toLowerCase().replace(/\s+/g, '-')}`,
          users: Math.round(totalUsers * 0.3),
          pageviews: Math.round(totalPageviews * 0.3),
        },
        {
          pagePath: `/tutorial-${topic.toLowerCase().replace(/\s+/g, '-')}`,
          users: Math.round(totalUsers * 0.2),
          pageviews: Math.round(totalPageviews * 0.2),
        },
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
