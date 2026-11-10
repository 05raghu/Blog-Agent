// Claude integration for generating performance dashboard components
//
// NOTE: the installed @anthropic-ai/sdk version (0.16.1) predates tool-use
// support entirely — there is no `tools` param on messages.stream() and no
// `Anthropic.Tool` type in this SDK version. An earlier version of this file
// referenced both, which type-checked as broken and crashed at runtime
// (ERR_EMPTY_RESPONSE) the moment this endpoint was actually exercised.
// Tool-calling (fetching metric history, generating healing proposals) is
// listed as a later Gen UI phase — not implemented yet — so it's removed
// here rather than faked.

import Anthropic from '@anthropic-ai/sdk';
import { DashboardContext } from './types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-haiku-4-5-20251001';

export async function generateDashboardComponents(context: DashboardContext) {
  const systemPrompt = `You are a UI generator for an editorial analytics dashboard. Generate React JSX components that visualize article performance metrics.

IMPORTANT:
1. Generate ONLY valid JSX/React components
2. Use Tailwind CSS for styling (via className)
3. Components should be self-contained and reactive
4. Use semantic HTML for accessibility
5. Include data visualization (charts, sparklines, cards)
6. Call available tools to fetch data and generate proposals

Design system (use these classes):
- Colors: text-ink-950, bg-paper, border-slate-200, text-signal (#A8DDE8), bg-signal/10
- Spacing: p-4, gap-4, rounded-lg
- Typography: font-semibold, text-sm, text-base
- Responsive: md:grid-cols-2, lg:grid-cols-4

Structure the dashboard with:
1. Header with article title and last update
2. KPI cards (impressions, CTR, engagement, leads)
3. Trend sparklines showing 7-day direction
4. Alert section (if any metric declined >20%)
5. Action buttons for common fixes
6. Healing proposal suggestions (if applicable)`;

  const userPrompt = `Generate a React dashboard for this article performance:

Article: "${context.articleTitle}"
Last Updated: ${context.lastUpdated}
Data Complete: ${context.dataCompletePercentage}%

Current Metrics:
- Impressions: ${context.metrics.impressions.toLocaleString()}
- Clicks: ${context.metrics.clicks}
- CTR: ${context.metrics.ctr.toFixed(2)}%
- Avg Position: ${context.metrics.avgPosition.toFixed(1)}
- Sessions: ${context.metrics.sessions.toLocaleString()}
- Engagement Duration: ${context.metrics.engagementDuration}s avg
- Form Leads: ${context.metrics.leads}

7-Day Trends:
- Impressions: ${context.trends.impressionTrend7d > 0 ? '+' : ''}${context.trends.impressionTrend7d}%
- CTR: ${context.trends.ctrTrend7d > 0 ? '+' : ''}${context.trends.ctrTrend7d}%
- Sessions: ${context.trends.sessionTrend7d > 0 ? '+' : ''}${context.trends.sessionTrend7d}%

Generate a dashboard component. If any metric declined >20%, generate an alert card with suggested actions.`;

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  });

  return stream;
}

export async function streamDashboardToResponse(context: DashboardContext) {
  const stream = await generateDashboardComponents(context);

  // Convert to ReadableStream for streaming response
  const chunks: string[] = [];
  let lastChunk = '';

  stream.on('text', (text) => {
    chunks.push(text);
    lastChunk = text;
  });

  return {
    stream,
    chunks,
    lastChunk,
  };
}
