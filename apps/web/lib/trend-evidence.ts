// Builds structured "trend evidence" for a topic by querying Google (via SERP provider)
// across three targeted angles: general web coverage, LinkedIn-specific posts, and recent news.
// This is a search-result-volume proxy for "is this topic currently active" — not literal
// engagement analytics (likes/shares/views), which would require platform-specific APIs.

import { getSerpProvider } from './serp';
import type { TrendEvidence } from '@blog-agent/integrations';

const RECENT_WINDOW_DAYS = 60;

const FRIENDLY_SOURCE_NAMES: Record<string, string> = {
  'linkedin.com': 'LinkedIn',
  'medium.com': 'Medium',
  'hbr.org': 'HBR',
  'forbes.com': 'Forbes',
  'techcrunch.com': 'TechCrunch',
  'nytimes.com': 'NYTimes',
  'wsj.com': 'WSJ',
  'inc.com': 'Inc.',
  'entrepreneur.com': 'Entrepreneur',
  'fastcompany.com': 'Fast Company',
  'businessinsider.com': 'Business Insider',
  'reuters.com': 'Reuters',
};

function hostnameFrom(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host;
  } catch {
    return null;
  }
}

function friendlySourceName(hostname: string): string {
  return FRIENDLY_SOURCE_NAMES[hostname] || hostname.split('.')[0].replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Loosely parses relative/absolute date strings returned by SERP news results
 * ("5 days ago", "2 weeks ago", "3 months ago", or an ISO/absolute date) and
 * returns whether it falls within RECENT_WINDOW_DAYS. Unparseable dates are
 * treated as recent (conservative — avoids under-counting real coverage).
 */
function isWithinRecentWindow(dateStr: string): boolean {
  if (!dateStr) return true;

  const relativeMatch = dateStr.match(/(\d+)\s*(day|week|month|year)s?\s*ago/i);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const days = unit === 'day' ? value : unit === 'week' ? value * 7 : unit === 'month' ? value * 30 : value * 365;
    return days <= RECENT_WINDOW_DAYS;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const daysAgo = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= RECENT_WINDOW_DAYS;
  }

  return true;
}

export async function buildTrendEvidence(topic: string): Promise<TrendEvidence> {
  const provider = await getSerpProvider();

  const [generalResult, linkedinResult, newsResult] = await Promise.all([
    provider.search(topic).catch(() => ({ organic: [], peopleAlsoAsk: [], relatedSearches: [] })),
    provider.searchSite(topic, 'linkedin.com').catch(() => ({ organic: [], peopleAlsoAsk: [], relatedSearches: [] })),
    provider.searchNews(topic).catch(() => []),
  ]);

  const linkedinPostCount = linkedinResult.organic.length;

  const recentNews = newsResult.filter((n) => isWithinRecentWindow(n.date));
  const recentArticleCount = recentNews.length;

  // General web search also surfaces real coverage — vendor/agency blog posts,
  // guides, etc. — that Google News never indexes (it only covers recognized
  // news publishers). Google doesn't reliably expose publish dates for organic
  // results, so this is counted separately rather than folded into
  // recentArticleCount, which makes a specific (verifiable) recency claim.
  const webArticleCount = generalResult.organic.length;

  // Collect distinct source domains across all three queries
  const sourceSet = new Set<string>();
  for (const o of generalResult.organic) {
    const host = hostnameFrom(o.link);
    if (host) sourceSet.add(friendlySourceName(host));
  }
  if (linkedinPostCount > 0) sourceSet.add('LinkedIn');
  for (const n of newsResult) {
    if (n.source) sourceSet.add(n.source);
  }
  const topSources = Array.from(sourceSet).slice(0, 6);

  const isTrending = linkedinPostCount >= 3 || recentArticleCount >= 3 || webArticleCount >= 5;

  const reasoningParts: string[] = [];
  if (linkedinPostCount > 0) {
    reasoningParts.push(`${linkedinPostCount}+ LinkedIn post${linkedinPostCount === 1 ? '' : 's'} found discussing this topic`);
  }
  if (recentArticleCount > 0) {
    reasoningParts.push(`${recentArticleCount} news article${recentArticleCount === 1 ? '' : 's'} published in the last ${RECENT_WINDOW_DAYS} days`);
  }
  if (webArticleCount > 0) {
    reasoningParts.push(`${webArticleCount}+ web articles/blog posts found discussing this topic`);
  }
  if (topSources.length > 0) {
    reasoningParts.push(`Top sources: ${topSources.join(', ')}`);
  }
  if (reasoningParts.length === 0) {
    reasoningParts.push('Limited current coverage found for this topic');
  }
  reasoningParts.push(`Verdict: ${isTrending ? 'Currently trending' : 'Steady / niche interest'}`);

  return {
    topic,
    linkedinPostCount,
    recentArticleCount,
    webArticleCount,
    topSources,
    isTrending,
    reasoning: reasoningParts.join(' — '),
    fetchedAt: new Date().toISOString(),
    linkedinPostLinks: linkedinResult.organic.map((o) => ({ title: o.title, link: o.link })),
    webArticleLinks: generalResult.organic.map((o) => ({ title: o.title, link: o.link })),
    newsArticleLinks: recentNews.map((n) => ({ title: n.title, link: n.link, date: n.date, source: n.source })),
  };
}
