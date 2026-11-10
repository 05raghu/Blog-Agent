// Mock metrics generator for testing Gen UI
// Generates realistic metric data for articles without real analytics

export interface MockMetricSnapshot {
  article_id: string;
  workspace_id: string;
  gsc_impressions: number;
  gsc_clicks: number;
  gsc_ctr: number;
  gsc_avg_position: number;
  ga4_sessions: number;
  ga4_engagement_duration: number;
  form_leads: number;
  created_at: string;
}

export function generateMockMetrics(articleId: string, workspaceId: string): MockMetricSnapshot {
  // Generate realistic but random metrics
  const impressions = Math.floor(Math.random() * 15000) + 1000;
  const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // 1-5% CTR
  const ctr = (clicks / impressions) * 100;
  const avgPosition = Math.floor(Math.random() * 15) + 3; // Position 3-18
  const sessions = Math.floor(clicks * (Math.random() * 0.8 + 0.5)); // 50-130% of clicks
  const engagementDuration = Math.floor(Math.random() * 180) + 20; // 20-200 seconds
  const leads = Math.floor(sessions * (Math.random() * 0.02 + 0.003)); // 0.3-2% lead rate

  return {
    article_id: articleId,
    workspace_id: workspaceId,
    gsc_impressions: impressions,
    gsc_clicks: clicks,
    gsc_ctr: parseFloat(ctr.toFixed(2)),
    gsc_avg_position: parseFloat(avgPosition.toFixed(1)),
    ga4_sessions: sessions,
    ga4_engagement_duration: engagementDuration,
    form_leads: Math.max(0, leads),
    created_at: new Date().toISOString(),
  };
}

export function generateMockHistoricalMetrics(
  articleId: string,
  workspaceId: string,
  daysBack: number = 7
): MockMetricSnapshot[] {
  const metrics: MockMetricSnapshot[] = [];
  const baseDate = new Date();

  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);

    // Generate slightly varied metrics to show trends
    const baseImpressions = Math.floor(Math.random() * 15000) + 1000;
    const trend = i > 3 ? 1.05 : 0.98; // Show growth then slight decline

    const impressions = Math.floor(baseImpressions * trend);
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
    const ctr = (clicks / impressions) * 100;

    metrics.push({
      article_id: articleId,
      workspace_id: workspaceId,
      gsc_impressions: impressions,
      gsc_clicks: clicks,
      gsc_ctr: parseFloat(ctr.toFixed(2)),
      gsc_avg_position: Math.floor(Math.random() * 15) + 3,
      ga4_sessions: Math.floor(clicks * (Math.random() * 0.8 + 0.5)),
      ga4_engagement_duration: Math.floor(Math.random() * 180) + 20,
      form_leads: Math.max(0, Math.floor(Math.random() * 5)),
      created_at: date.toISOString(),
    });
  }

  return metrics;
}
