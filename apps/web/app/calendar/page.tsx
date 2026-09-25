'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { STAGE_COLORS, STAGE_LABELS } from '@blog-agent/domain';

interface Article {
  id: string;
  contentId: string;
  title: string;
  status: string;
  topicId: string;
  strategyId: string;
  plannedPublishDate: string | null;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const urlStrategyId = searchParams?.get('strategyId') || '';

  const [strategyId, setStrategyId] = useState(urlStrategyId);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(!!urlStrategyId); // Start loading if URL has strategyId
  const [error, setError] = useState('');

  useEffect(() => {
    // Update strategyId if URL param changes
    if (urlStrategyId) {
      setStrategyId(urlStrategyId);
      fetchArticles(urlStrategyId);
    }
  }, [urlStrategyId]);

  const fetchArticles = async (sid: string) => {
    if (!sid) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/articles?strategyId=${sid}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Group articles by publish date
  const groupedByDate = articles.reduce((acc, article) => {
    const dateKey = article.plannedPublishDate
      ? new Date(article.plannedPublishDate).toISOString().split('T')[0]
      : 'unscheduled';
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  return (
    <>
      <style>{`
        .group:hover h4 {
          color: #0EA5E9 !important;
        }
      `}</style>
      <div className="min-h-screen bg-parchment">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-hero" style={{ fontSize: '46px' }}>
                Content Calendar
              </h1>
              {strategyId && (
                <Link href={`/topics?strategyId=${strategyId}`} className="btn-secondary text-sm">
                  ← View Topics
                </Link>
              )}
            </div>
            <p className="lead text-slate-700">
              Plan and track up to 5 concurrent articles
            </p>
          </div>

          {/* Strategy Selector */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Strategy ID</label>
                <input
                  type="text"
                  value={strategyId}
                  onChange={(e) => {
                    setStrategyId(e.target.value);
                    setError('');
                  }}
                  placeholder="Paste strategy ID from /strategy page"
                  style={{ borderRadius: '10px' }}
                  className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => fetchArticles(strategyId)}
                  className="btn-primary"
                >
                  Load Calendar
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message mb-8">
              <span className="error-message-icon">⚠</span>
              <span className="error-message-text">{error}</span>
            </div>
          )}

          {/* Calendar by Publish Date */}
          {!loading && articles.length > 0 ? (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium">
                      {dateKey === 'unscheduled' ? '📋 Unscheduled' : (
                        <>
                          Scheduled on:{' '}
                          <span style={{ color: '#0EA5E9' }} className="font-semibold">
                            {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </>
                      )}
                    </h3>
                    <span className="text-sm text-slate-500">
                      {groupedByDate[dateKey].length} article{groupedByDate[dateKey].length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Articles for this date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedByDate[dateKey].map((article) => (
                      <Link
                        key={article.id}
                        href={`/articles/${article.id}/editor?strategyId=${article.strategyId || ''}`}
                        className="group"
                      >
                        <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-shadow h-full cursor-pointer">
                          {/* Status Badge */}
                          <div
                            className="inline-block px-3 py-1 rounded text-xs font-medium text-white mb-3"
                            style={{
                              backgroundColor:
                                STAGE_COLORS[article.status as keyof typeof STAGE_COLORS] ||
                                '#6B7280',
                            }}
                          >
                            {STAGE_LABELS[article.status as keyof typeof STAGE_LABELS] ||
                              article.status}
                          </div>

                          {/* Title */}
                          <h4 className="font-medium text-md mb-2 line-clamp-2 text-slate-900 group-hover:font-medium transition-all" style={{ color: 'inherit' }}>
                            {article.title}
                          </h4>

                          {/* Meta */}
                          <div className="text-xs text-slate-600 space-y-1">
                            <div>📝 {article.wordCount} words</div>
                            <div>
                              Created{' '}
                              {new Date(article.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Hover: Click to open */}
                          <div className="mt-3 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#0EA5E9' }}>
                            → Open details
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Concurrent limit info */}
              <div className="text-sm text-slate-600 text-center mt-8 pt-4 border-t border-slate-200">
                {articles.length} of 5 concurrent articles in use
              </div>
            </div>
          ) : !loading && !strategyId ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No strategy selected</div>
              <div className="empty-state-description">
                Enter a strategy ID to view your content calendar
              </div>
              <Link href="/strategy" className="btn-secondary mt-6">
                Create Strategy First
              </Link>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin mb-4 text-4xl">⚙</div>
              <p className="text-lg font-medium">Loading calendar...</p>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No articles yet</div>
              <div className="empty-state-description">
                Go to Topics to create your first article
              </div>
              <Link href={`/topics?strategyId=${strategyId}`} className="btn-secondary mt-6">
                Browse Topics
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-parchment">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin mb-4 text-4xl">⚙</div>
            <p className="text-lg font-medium">Loading calendar...</p>
          </div>
        </div>
      </div>
    }>
      <CalendarContent />
    </Suspense>
  );
}
