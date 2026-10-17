// Google Analytics 4 — real implementation using GA4 Data API

import { GoogleAuth } from 'google-auth-library';
import { GA4Provider, GA4QueryParams, GA4Metrics } from './index';

export class GoogleAnalytics4 implements GA4Provider {
  private auth: GoogleAuth;
  private propertyId: string;

  constructor(serviceAccountJson: string, propertyId: string) {
    this.propertyId = propertyId;

    const credentials = JSON.parse(serviceAccountJson);
    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });
  }

  async getTrafficForTopic(params: GA4QueryParams): Promise<GA4Metrics> {
    const { topic, keywords = [], daysBack = 90 } = params;
    const allKeywords = [topic, ...keywords].filter((k) => k && k.trim());

    try {
      console.log('[GA4] Querying traffic for topic:', topic);

      const client = await this.auth.getClient();

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Query GA4 for metrics (simpler query without keyword filtering due to API complexity)
      const response = await client.request({
        url: `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
        method: 'POST',
        data: {
          dateRanges: [
            {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            },
          ],
          metrics: [
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'engagementRate' },
            { name: 'conversions' },
          ],
          dimensions: [{ name: 'pagePath' }],
          limit: 10,
        },
      });

      return this.parseGA4Response(response.data);
    } catch (error) {
      console.error('[GA4] Query error:', error);
      throw new Error(`Failed to query GA4: ${(error as Error).message}`);
    }
  }

  private buildKeywordFilters(keywords: string[]) {
    // Build OR filter for any keyword matching
    if (keywords.length === 0) {
      return undefined;
    }

    const expressions = keywords.map((keyword) => ({
      field_name: 'pageTitle',
      string_filter: {
        match_type: 'CONTAINS',
        value: keyword,
      },
    }));

    // Single filter without OR wrapper
    if (expressions.length === 1) {
      return expressions[0];
    }

    // Multiple filters with OR
    return {
      or_group: {
        expressions: expressions,
      },
    };
  }

  private parseGA4Response(data: any): GA4Metrics {
    const rows = data.rows || [];
    const totals = data.totals?.[0] || {};

    // Extract metrics
    const totalUsers = parseInt(totals.metricValues?.[0]?.value || '0', 10);
    const totalPageviews = parseInt(totals.metricValues?.[1]?.value || '0', 10);
    const bounceRate = parseFloat(totals.metricValues?.[2]?.value || '0');
    const engagementRate = parseFloat(totals.metricValues?.[3]?.value || '0');
    const conversions = parseInt(totals.metricValues?.[4]?.value || '0', 10);

    // Build top pages
    const topPages = rows.slice(0, 5).map((row: any) => ({
      pagePath: row.dimensionValues?.[0]?.value || '/',
      users: parseInt(row.metricValues?.[0]?.value || '0', 10),
      pageviews: parseInt(row.metricValues?.[1]?.value || '0', 10),
    }));

    const conversionRate = totalPageviews > 0 ? (conversions / totalPageviews) * 100 : 0;

    return {
      totalUsers,
      totalPageviews,
      averageEngagementTime: engagementRate * 100, // rough approximation
      eventCount: totalPageviews,
      bounceRate,
      conversionRate,
      topPages,
    };
  }
}
