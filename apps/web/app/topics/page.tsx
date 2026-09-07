'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Topic {
  id: string;
  title: string;
  summary: string;
  format: string;
  score: number;
  breakdown: Record<string, number>;
  createdAt: string;
}

function TopicsContent() {
  const searchParams = useSearchParams();
  const strategyId = searchParams?.get('strategyId');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!strategyId) {
      setError('No strategy ID provided');
      setLoading(false);
      return;
    }

    fetchTopics();
  }, [strategyId]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/strategy/topics?strategyId=${strategyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const data = await response.json();
      setTopics(data.topics || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin mb-4 text-4xl">⚙</div>
            <p className="text-lg font-medium">Generating topic candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-hero" style={{ fontSize: '46px' }}>
              Topic Candidates
            </h1>
            <Link href="/strategy" className="btn-secondary text-sm">
              New Strategy
            </Link>
          </div>
          <p className="lead text-slate-700">
            {topics.length} topics scored against your strategy
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message mb-8">
            <span className="error-message-icon">⚠</span>
            <span className="error-message-text">{error}</span>
          </div>
        )}

        {/* Topics Grid */}
        {topics.length > 0 ? (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-editorial text-lg mb-1">{topic.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">{topic.summary}</p>
                    <div className="flex gap-3 items-center">
                      <span className="inline-block px-3 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                        {topic.format}
                      </span>
                    </div>
                  </div>

                  {/* Score Card */}
                  <div className="ml-6">
                    <div className="bg-gradient-to-br from-signal to-azure rounded-lg p-6 text-center min-w-32">
                      <div className="text-4xl font-bold text-ink-950 mb-1">{topic.score}</div>
                      <div className="text-xs font-medium text-ink-950">Score</div>
                    </div>
                  </div>
                </div>

                {/* Rubric Breakdown */}
                <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                  <div className="bg-slate-50 rounded p-2">
                    <div className="font-medium">{topic.breakdown.icpFit || 0}</div>
                    <div className="text-slate-600">ICP Fit</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <div className="font-medium">{topic.breakdown.competitiveMoat || 0}</div>
                    <div className="text-slate-600">Competitive</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <div className="font-medium">{topic.breakdown.contentMixAlignment || 0}</div>
                    <div className="text-slate-600">Content Mix</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <div className="font-medium">{topic.breakdown.offeringRelevance || 0}</div>
                    <div className="text-slate-600">Offering</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <div className="font-medium">{topic.breakdown.volumePotential || 0}</div>
                    <div className="text-slate-600">Volume</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <button className="text-sm text-signal font-medium hover:underline">
                    ✓ Approve Topic
                  </button>
                  <button className="text-sm text-slate-600 font-medium hover:underline">
                    → Create Article
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No topics generated</div>
            <div className="empty-state-description">
              {error ? 'Try creating a new strategy' : 'Topics will appear here'}
            </div>
            <Link href="/strategy" className="btn-secondary mt-6">
              Create Strategy
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-300 text-center text-sm text-slate-600">
          <p>Strategy ID: {strategyId?.substring(0, 20)}...</p>
        </div>
      </div>
    </div>
  );
}

export default function TopicsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-parchment">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin mb-4 text-4xl">⚙</div>
            <p className="text-lg font-medium">Loading topics...</p>
          </div>
        </div>
      </div>
    }>
      <TopicsContent />
    </Suspense>
  );
}
