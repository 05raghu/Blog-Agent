'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';

export default function OverviewPage() {
  const router = useRouter();
  const { user, loading } = useWorkspace();
  const [loggingOut, setLoggingOut] = useState(false);
  const [counts, setCounts] = useState({
    strategies: 0,
    topics: 0,
    articles: 0,
    smeProfiles: 0,
    knowledgeSources: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch strategies first
        const strategiesRes = await fetch('/api/strategy');
        const strategiesData = strategiesRes.ok ? await strategiesRes.json() : { strategies: [] };
        const strategies = strategiesData.strategies || [];

        // Fetch SMEs and knowledge sources
        const [smeRes, knowledgeRes] = await Promise.all([
          fetch('/api/sme'),
          fetch('/api/knowledge/sources'),
        ]);

        const smes = smeRes.ok ? await smeRes.json() : { smes: [] };
        const sources = knowledgeRes.ok ? await knowledgeRes.json() : { sources: [] };

        // Fetch topics and articles for each strategy
        let allTopics = 0;
        let allArticles = 0;

        for (const strategy of strategies) {
          const [topicsRes, articlesRes] = await Promise.all([
            fetch(`/api/strategy/topics?strategyId=${strategy.id}`),
            fetch(`/api/articles?strategyId=${strategy.id}`),
          ]);

          const topicsData = topicsRes.ok ? await topicsRes.json() : { topics: [] };
          const articlesData = articlesRes.ok ? await articlesRes.json() : { articles: [] };

          allTopics += (topicsData.topics || topicsData.data || []).length;
          allArticles += (articlesData.articles || articlesData.data || []).length;
        }

        setCounts({
          strategies: strategies.length,
          topics: allTopics,
          articles: allArticles,
          smeProfiles: smes.smes?.length || 0,
          knowledgeSources: sources.sources?.length || 0,
        });
      } catch (err) {
        console.error('Error fetching counts:', err);
      }
    };

    if (user) {
      fetchCounts();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      // Call logout API to clear cookie on server side
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear auth token from localStorage
      localStorage.removeItem('authToken');
      // Redirect to login
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/auth/login');
    }
  };

  // Get role badge styling
  const getRoleBadge = () => {
    const role = user?.role as string;
    if (role === 'admin') {
      return { text: 'Admin', bg: 'bg-purple-100', color: 'text-purple-700' };
    }
    if (['editor', 'reviewer'].includes(role)) {
      return { text: 'Reviewer', bg: 'bg-blue-100', color: 'text-blue-700' };
    }
    if (['marketer', 'sme'].includes(role)) {
      return { text: 'Author', bg: 'bg-green-100', color: 'text-green-700' };
    }
    return { text: 'Viewer', bg: 'bg-gray-100', color: 'text-gray-700' };
  };

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

  return (
    <div className="min-h-screen bg-parchment">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-ink-950">Blog Agent</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-slate-600">{user.email}</p>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge().bg} ${getRoleBadge().color}`}>
                👤 {getRoleBadge().text}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/strategy')}
              className="btn-secondary"
            >
              → Go to Strategy
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-ink-950 mb-4">Dashboard</h2>
          <p className="text-slate-600 mb-8">
            Welcome to Blog Agent! Manage your content strategy, topics, articles, and more.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Strategy */}
          <div
            className="bg-white rounded-lg border border-slate-200 p-6 cursor-default"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Strategies</h3>
            <p className="text-sm text-slate-600 mb-4">Define your content strategy, offerings, and target ICPs</p>
            <p className="text-3xl font-bold text-signal">{counts.strategies}</p>
          </div>

          {/* Topics */}
          <div
            className="bg-white rounded-lg border border-slate-200 p-6 cursor-default"
          >
            <div className="text-4xl mb-3">💡</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Topics</h3>
            <p className="text-sm text-slate-600 mb-4">Generate and manage content topics with AI scoring</p>
            <p className="text-3xl font-bold text-signal">{counts.topics}</p>
          </div>

          {/* Articles */}
          <div
            className="bg-white rounded-lg border border-slate-200 p-6 cursor-default"
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Articles</h3>
            <p className="text-sm text-slate-600 mb-4">Create and manage your content calendar</p>
            <p className="text-3xl font-bold text-signal">{counts.articles}</p>
          </div>

          {/* SME */}
          <div
            className="bg-white rounded-lg border border-slate-200 p-6 cursor-default"
          >
            <div className="text-4xl mb-3">👤</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">SME Profiles</h3>
            <p className="text-sm text-slate-600 mb-4">Manage subject matter experts and their expertise</p>
            <p className="text-3xl font-bold text-signal">{counts.smeProfiles}</p>
          </div>

          {/* Knowledge */}
          <div
            className="bg-white rounded-lg border border-slate-200 p-6 cursor-default"
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Knowledge</h3>
            <p className="text-sm text-slate-600 mb-4">Manage sources, brand guidelines, and claim verification</p>
            <p className="text-3xl font-bold text-signal">{counts.knowledgeSources}</p>
          </div>

          {/* Calendar */}
          <div
            className="bg-white rounded-lg border border-slate-200 p-6 cursor-default"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Calendar</h3>
            <p className="text-sm text-slate-600 mb-4">View and manage your content publishing schedule</p>
            <p className="text-3xl font-bold text-signal">-</p>
          </div>
        </div>
      </main>
    </div>
  );
}
