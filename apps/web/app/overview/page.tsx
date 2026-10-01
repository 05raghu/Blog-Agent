'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { signOut } from '@/lib/supabase-client';

export default function OverviewPage() {
  const router = useRouter();
  const { user, workspaceId, loading } = useWorkspace();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/auth/login');
    }
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
            <p className="text-sm text-slate-600">Welcome, {user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
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
          <Link
            href="/strategy"
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Strategies</h3>
            <p className="text-sm text-slate-600">Define your content strategy, offerings, and target ICPs</p>
          </Link>

          {/* Topics */}
          <Link
            href="/topics"
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
          >
            <div className="text-4xl mb-3">💡</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Topics</h3>
            <p className="text-sm text-slate-600">Generate and manage content topics with AI scoring</p>
          </Link>

          {/* Articles */}
          <Link
            href="/articles"
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Articles</h3>
            <p className="text-sm text-slate-600">Create and manage your content calendar</p>
          </Link>

          {/* SME */}
          <Link
            href="/sme"
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
          >
            <div className="text-4xl mb-3">👤</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">SME Profiles</h3>
            <p className="text-sm text-slate-600">Manage subject matter experts and their expertise</p>
          </Link>

          {/* Knowledge */}
          <Link
            href="/knowledge"
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Knowledge</h3>
            <p className="text-sm text-slate-600">Manage sources, brand guidelines, and claim verification</p>
          </Link>

          {/* Calendar */}
          <Link
            href="/calendar"
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-bold text-ink-950 mb-2">Calendar</h3>
            <p className="text-sm text-slate-600">View and manage your content publishing schedule</p>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-slate-600 text-sm">Workspace</p>
            <p className="text-2xl font-bold text-ink-950">{workspaceId}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-slate-600 text-sm">Email</p>
            <p className="text-lg font-bold text-ink-950 truncate">{user.email}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <p className="text-slate-600 text-sm">User ID</p>
            <p className="text-sm font-mono text-ink-950 truncate">{user.id}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
