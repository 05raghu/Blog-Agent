// GA4 Analytics provider interface — queries Google Analytics 4 for traffic data

// Export implementations
export { GoogleAnalytics4 } from './google-analytics';
export { MockGA4 } from './mock';

export interface GA4QueryParams {
  topic: string;
  keywords?: string[];
  daysBack?: number; // how many days to look back (default 90)
}

export interface GA4Metrics {
  totalUsers: number; // unique users
  totalPageviews: number; // total page views
  averageEngagementTime: number; // seconds
  eventCount: number; // total events
  bounceRate: number; // 0-100, percentage
  conversionRate: number; // 0-100, percentage
  topPages: Array<{
    pagePath: string;
    users: number;
    pageviews: number;
  }>;
}

export interface GA4Provider {
  getTrafficForTopic(params: GA4QueryParams): Promise<GA4Metrics>;
}
