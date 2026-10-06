'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/supabase-client';

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setWorkspaceName(name);

    // Auto-generate slug: lowercase, replace spaces with hyphens
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    setWorkspaceSlug(slug);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get current session for auth token
      const session = await getSession();
      if (!session) {
        setError('Not authenticated. Please sign in first.');
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceName,
          workspaceSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create workspace');
        return;
      }

      setSuccess(true);
      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/overview');
      }, 1500);
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-slate-200 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-ink-950 mb-2">Create Workspace</h1>
          <p className="text-slate-600 mb-6">
            Set up your first workspace to start managing content
          </p>

          {success ? (
            <div className="bg-cyan-50 border-2 border-signal rounded-lg p-4 text-center">
              <p className="text-signal font-semibold">✓ Workspace created!</p>
              <p className="text-sm text-slate-600 mt-1">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              {error && (
                <div className="bg-orange-50 border-2 border-orange-400 rounded p-3 text-sm text-orange-900">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink-950 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={handleNameChange}
                  placeholder="e.g., Codewave Marketing"
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-signal"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-1">Give your workspace a memorable name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-950 mb-2">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  placeholder="e.g., codewave-marketing"
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-signal"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-1">Lowercase, alphanumeric and hyphens only</p>
              </div>

              <button
                type="submit"
                disabled={loading || !workspaceName || !workspaceSlug}
                className="w-full bg-signal text-white font-semibold py-2 rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Workspace'}
              </button>

              <p className="text-xs text-slate-500 text-center">
                You can invite team members after creating your workspace
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-600 mt-4">
          Need help?{' '}
          <a href="/docs" className="text-signal hover:underline">
            Read the docs
          </a>
        </p>
      </div>
    </div>
  );
}
