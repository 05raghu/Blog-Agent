'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';

interface Strategy {
  id: string;
  title: string;
  offerings: string[];
  targetIcps: string[];
  createdAt: string;
}

export default function StrategyPage() {
  const router = useRouter();
  const { user, loading } = useWorkspace();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user) {
      fetchStrategies();
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-signal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const fetchStrategies = async () => {
    try {
      setLoadingStrategies(true);
      const response = await fetch('/api/strategy');
      if (response.ok) {
        const data = await response.json();
        setStrategies(data.strategies || []);
      }
    } catch (err) {
      console.error('Failed to fetch strategies:', err);
    } finally {
      setLoadingStrategies(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-hero mb-4" style={{ fontSize: '46px' }}>
            Editorial Strategies
          </h1>
          <p className="lead text-slate-700">
            Manage your content strategies and generate high-scoring topic candidates
          </p>
        </div>

        {/* Strategy List */}
        <div className="space-y-8">
          <div className="bg-white rounded-lg border border-slate-200 p-8">
            {loadingStrategies ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-slate-600">Loading strategies...</p>
              </div>
            ) : strategies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No strategies yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {strategies.map((strategy, index) => (
                  <div
                    key={strategy.id}
                    className="border border-slate-200 rounded-lg p-4 hover:border-slate-400 transition-colors flex gap-4"
                  >
                    {/* Strategy Number Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>

                    {/* Strategy Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-900">{strategy.offerings?.join(', ') || strategy.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Target ICPs: {strategy.targetIcps?.join(', ') || 'None'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Created: {new Date(strategy.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/topics?strategyId=${strategy.id}`}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            View Topics
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link href="/strategy/new" className="btn-primary">
            + Create New Strategy
          </Link>
        </div>
      </div>
    </div>
  );
}
