// Gen UI: Performance Dashboard streaming endpoint
// POST /api/gen-ui/performance-dashboard
// Generates interactive analytics dashboard with React components via Claude

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';
import { generateDashboardComponents } from '@/lib/gen-ui/claude-dashboard';
import { DashboardContext } from '@/lib/gen-ui/types';
import { generateMockMetrics, generateMockHistoricalMetrics } from '@/lib/gen-ui/mock-metrics';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const { articleId, demo } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Fetch latest metric snapshot
    let metrics = null;
    const { data: metricsData, error: metricsError } = await supabase
      .from('metric_snapshots')
      .select('*')
      .eq('article_id', articleId)
      .eq('workspace_id', workspace.workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Use real metrics if available, otherwise use demo data
    if (metricsError || !metricsData) {
      if (demo) {
        metrics = generateMockMetrics(articleId, workspace.workspaceId);
        console.log('[Gen UI] Using demo metrics for article:', articleId);
      } else {
        return NextResponse.json(
          { error: 'No metrics found for this article. Check back after 24 hours of publishing. Or pass demo=true for test data.' },
          { status: 404 }
        );
      }
    } else {
      metrics = metricsData;
    }

    // Fetch historical metrics for trends (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let historicalMetrics: any[] = [];
    if (demo) {
      // Use mock historical data
      historicalMetrics = generateMockHistoricalMetrics(articleId, workspace.workspaceId, 7);
    } else {
      const { data } = await supabase
        .from('metric_snapshots')
        .select('*')
        .eq('article_id', articleId)
        .eq('workspace_id', workspace.workspaceId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });
      historicalMetrics = data || [];
    }

    // Calculate trends (comparing first week snapshot to latest)
    const oldestMetric = historicalMetrics?.[0];
    const impressionTrend7d = oldestMetric
      ? (((metrics.gsc_impressions || 0) - (oldestMetric.gsc_impressions || 0)) / (oldestMetric.gsc_impressions || 1)) * 100
      : 0;
    const ctrTrend7d = oldestMetric
      ? (((metrics.gsc_ctr || 0) - (oldestMetric.gsc_ctr || 0)) / (oldestMetric.gsc_ctr || 1)) * 100
      : 0;
    const sessionTrend7d = oldestMetric
      ? (((metrics.ga4_sessions || 0) - (oldestMetric.ga4_sessions || 0)) / (oldestMetric.ga4_sessions || 1)) * 100
      : 0;

    // Build dashboard context
    const dashboardContext: DashboardContext = {
      articleId,
      articleTitle: article.title || 'Untitled Article',
      metrics: {
        impressions: metrics.gsc_impressions || 0,
        clicks: metrics.gsc_clicks || 0,
        ctr: metrics.gsc_ctr || 0,
        avgPosition: metrics.gsc_avg_position || 0,
        sessions: metrics.ga4_sessions || 0,
        engagementDuration: metrics.ga4_engagement_duration || 0,
        leads: metrics.form_leads || 0,
      },
      trends: {
        impressionTrend7d: Math.round(impressionTrend7d),
        ctrTrend7d: Math.round(ctrTrend7d),
        sessionTrend7d: Math.round(sessionTrend7d),
      },
      lastUpdated: new Date(metrics.created_at).toLocaleString(),
      dataCompletePercentage: 100,
    };

    // Generate streaming dashboard components
    const stream = await generateDashboardComponents(dashboardContext);

    // Convert Anthropic stream to HTTP response stream
    return new NextResponse(
      stream.toReadableStream(),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error('[Gen UI] Performance dashboard error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate dashboard',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
