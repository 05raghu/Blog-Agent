'use client';

import { useState } from 'react';
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

export default function CalendarPage() {
  const [strategyId, setStrategyId] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-hero mb-4" style={{ fontSize: '46px' }}>
            Content Calendar
          </h1>
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

        {/* Calendar Grid */}
        {!loading && articles.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
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
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-signal">
                      {article.title}
                    </h3>

                    {/* Meta */}
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>📝 {article.wordCount} words</div>
                      {article.plannedPublishDate && (
                        <div>
                          📅{' '}
                          {new Date(article.plannedPublishDate).toLocaleDateString()}
                        </div>
                      )}
                      <div>
                        Created{' '}
                        {new Date(article.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Hover: Click to open */}
                    <div className="mt-3 text-xs font-medium text-signal opacity-0 group-hover:opacity-100 transition-opacity">
                      → Open details
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty slots indicator */}
            {articles.length < 5 && (
              <div className="text-sm text-slate-600 text-center">
                {5 - articles.length} slot{articles.length !== 4 ? 's' : ''} available
              </div>
            )}
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
            <Link href="/topics" className="btn-secondary mt-6">
              Browse Topics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
