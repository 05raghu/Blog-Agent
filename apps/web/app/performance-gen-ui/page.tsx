'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PerformanceDashboardStream } from '@/components/gen-ui/performance-dashboard-stream';

export default function PerformanceGenUIPage() {
  const [articleId, setArticleId] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [recentArticles, setRecentArticles] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [useDemo, setUseDemo] = useState(false);
  const router = useRouter();

  const fetchRecentArticles = async () => {
    try {
      setLoadingArticles(true);
      const response = await fetch('/api/articles?limit=10');
      const data = await response.json();
      setRecentArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleLoadDashboard = () => {
    if (articleId.trim()) {
      setSelectedArticleId(articleId);
    }
  };

  const handleSelectArticle = (id: string) => {
    setArticleId(id);
    setSelectedArticleId(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink-950 mb-2">
            ✨ Performance Dashboard (Gen UI)
          </h1>
          <p className="text-slate-600">
            AI-generated analytics dashboard with real-time Claude streaming
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <label htmlFor="articleId" className="block text-sm font-medium text-slate-900 mb-2">
              Article ID
            </label>
            <div className="flex gap-2">
              <input
                id="articleId"
                type="text"
                value={articleId}
                onChange={(e) => setArticleId(e.target.value)}
                placeholder="Enter article UUID or select from recent..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-signal"
              />
              <button
                onClick={handleLoadDashboard}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Load Dashboard
              </button>
            </div>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="demoMode"
              checked={useDemo}
              onChange={(e) => setUseDemo(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="demoMode" className="text-sm text-amber-900 font-medium">
              📊 Use demo/test metrics (don't need real analytics data)
            </label>
          </div>

        {/* Recent Articles */}
          <div>
            <button
              onClick={fetchRecentArticles}
              disabled={loadingArticles}
              className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
            >
              {loadingArticles ? 'Loading...' : 'Browse Recent Articles'}
            </button>

            {recentArticles.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {recentArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleSelectArticle(article.id)}
                    className={`p-3 text-left rounded-lg border-2 transition-colors ${
                      selectedArticleId === article.id
                        ? 'border-signal bg-signal/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {article.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{article.id}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dashboard */}
        {selectedArticleId && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <PerformanceDashboardStream
              articleId={selectedArticleId}
              demo={useDemo}
              onError={(error) => console.error('Dashboard error:', error)}
            />
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">About Gen UI Dashboards</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Real-time streaming from Claude API</li>
            <li>✓ Dynamic component generation based on metrics</li>
            <li>✓ No hardcoded UI layouts</li>
            <li>✓ Adapts to article type and performance data</li>
            <li>⚠️ Safe JSX rendering system in development</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
