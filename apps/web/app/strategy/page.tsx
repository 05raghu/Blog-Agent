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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<Strategy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    offerings: [] as string[],
    icps: [] as string[],
    geographies: [] as string[],
    competitors: [] as string[],
    contentMix: '' as string,
    description: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const handleEditStrategy = async (strategy: Strategy) => {
    try {
      // Fetch full strategy data from API
      const response = await fetch(`/api/strategy/${strategy.id}`);
      if (response.ok) {
        const fullStrategy = await response.json();
        const contentMixObj = fullStrategy.content_mix || {};
        const contentMixStr = Object.entries(contentMixObj)
          .map(([k, v]) => `${k}:${v}`)
          .join('; ');
        setEditingStrategy(strategy);
        setEditFormData({
          title: fullStrategy.title || '',
          offerings: fullStrategy.offerings || [],
          icps: fullStrategy.icps || [],
          geographies: fullStrategy.geographies || [],
          competitors: fullStrategy.competitors || [],
          contentMix: contentMixStr,
          description: fullStrategy.description || '',
        });
        setShowEditModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch strategy details:', err);
    }
  };

  const parseContentMix = (str: string): Record<string, number> => {
    const mix: Record<string, number> = {};
    if (!str.trim()) return mix;

    str.split(';').forEach((item) => {
      const [key, value] = item.split(':').map((s) => s.trim());
      if (key && value) {
        mix[key] = parseInt(value, 10);
      }
    });

    return mix;
  };

  const handleSaveStrategy = async () => {
    if (!editingStrategy) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/strategy/${editingStrategy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editFormData.title,
          offerings: editFormData.offerings,
          icps: editFormData.icps,
          geographies: editFormData.geographies,
          competitors: editFormData.competitors,
          contentMix: parseContentMix(editFormData.contentMix),
          description: editFormData.description,
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingStrategy(null);
        setToast({ message: '✅ Strategy updated successfully!', type: 'success' });
        setTimeout(() => setToast(null), 3000);
        await fetchStrategies();
      } else {
        setToast({ message: '❌ Failed to update strategy', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to update strategy:', err);
      setToast({ message: '❌ Error updating strategy', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStrategy = (strategy: Strategy) => {
    setStrategyToDelete(strategy);
    setShowDeleteModal(true);
  };

  const confirmDeleteStrategy = async () => {
    if (!strategyToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/strategy/${strategyToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setStrategyToDelete(null);
        setToast({ message: '✅ Strategy deleted successfully!', type: 'success' });
        setTimeout(() => setToast(null), 3000);
        await fetchStrategies();
      } else {
        setToast({ message: '❌ Failed to delete strategy', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to delete strategy:', err);
      setToast({ message: '❌ Error deleting strategy', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-parchment">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-4 rounded-lg text-sm font-medium text-white z-50 shadow-lg animate-fade-in ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
          style={{ minWidth: '300px' }}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-hero" style={{ fontSize: '46px' }}>
              Editorial Strategies
            </h1>
            <button
              onClick={() => router.push('/overview')}
              className="btn-secondary"
            >
              ← Back to Overview
            </button>
          </div>
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
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">{strategy.offerings?.join(', ') || strategy.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Target ICPs: {strategy.targetIcps?.join(', ') || 'None'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Created: {new Date(strategy.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Link
                            href={`/topics?strategyId=${strategy.id}`}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                          >
                            View Topics
                          </Link>
                          <button
                            onClick={() => handleEditStrategy(strategy)}
                            className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-all flex-shrink-0"
                            title="Edit strategy"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteStrategy(strategy)}
                            className="p-2 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-all flex-shrink-0"
                            title="Delete strategy"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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

        {/* Edit Modal */}
        {showEditModal && editingStrategy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">Edit Strategy</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      title: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    placeholder="Strategy title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      description: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    rows={3}
                    placeholder="Strategy description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Offerings (comma-separated)</label>
                  <textarea
                    value={editFormData.offerings.join(', ')}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      offerings: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target ICPs (comma-separated)</label>
                  <textarea
                    value={editFormData.icps.join(', ')}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      icps: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Geographies (comma-separated)</label>
                  <textarea
                    value={editFormData.geographies.join(', ')}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      geographies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Competitors (comma-separated)</label>
                  <textarea
                    value={editFormData.competitors.join(', ')}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      competitors: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content Mix (key:value; format)</label>
                  <textarea
                    value={editFormData.contentMix}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      contentMix: e.target.value
                    })}
                    placeholder="e.g., how-to:30; thought-leadership:40; case-study:30"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStrategy}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && strategyToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold">Delete Strategy?</h2>
              </div>

              <div className="p-6">
                <p className="text-slate-600 mb-4">
                  Are you sure you want to delete this strategy? This will also delete all associated topics.
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {strategyToDelete.offerings?.join(', ')}
                </p>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteStrategy}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
