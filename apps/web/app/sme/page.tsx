'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';

interface SMEProfile {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  expertise: string[];
  biography?: string;
  capacityHoursPerMonth: number;
  hoursUsed?: number;
  pastContributions?: string[];
  createdAt: string;
}

function SMEContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const strategyId = searchParams?.get('strategyId');
  const { workspaceId, user, loading: wsLoading } = useWorkspace();

  // All hooks must be declared before any conditional returns
  const [smes, setSmes] = useState<SMEProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    expertise: '',
    biography: '',
    capacityHoursPerMonth: 10,
  });

  useEffect(() => {
    if (!wsLoading && !user) {
      router.push('/auth/login');
    }
  }, [wsLoading, user, router]);

  if (wsLoading) {
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

  useEffect(() => {
    if (!wsLoading && workspaceId) {
      fetchSMEs();
    }
  }, [workspaceId, wsLoading]);

  const fetchSMEs = async () => {
    try {
      setLoading(true);
      const apiResponse = await fetch(`/api/sme?workspaceId=${workspaceId}`);

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        setSmes(data.smes || []);
      } else {
        setError('Failed to load SME profiles');
      }
    } catch (err) {
      setError('Failed to load SME profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSME = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setIsAdding(true);
      setError('');

      const expertiseArray = formData.expertise
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e);

      const smeData = {
        name: formData.name,
        email: formData.email,
        expertise: expertiseArray,
        biography: formData.biography,
        capacityHoursPerMonth: formData.capacityHoursPerMonth,
      };

      if (editingId) {
        // Update via API
        const response = await fetch('/api/sme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            smeId: editingId,
            sme: {
              ...smeData,
              hoursUsed: smes.find((s) => s.id === editingId)?.hoursUsed || 0,
              pastContributions: smes.find((s) => s.id === editingId)?.pastContributions || [],
              createdAt: smes.find((s) => s.id === editingId)?.createdAt,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const updated = smes.map((s) => (s.id === editingId ? result.sme : s));
          setSmes(updated);
        }
      } else {
        // Create via API
        const response = await fetch('/api/sme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            sme: smeData,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const updated = [result.sme, ...smes];
          setSmes(updated);
        }
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        expertise: '',
        biography: '',
        capacityHoursPerMonth: 10,
      });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSME = async (id: string) => {
    if (confirm('Delete this SME profile?')) {
      try {
        const response = await fetch(`/api/sme?workspaceId=${workspaceId}&smeId=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const updated = smes.filter((s) => s.id !== id);
          setSmes(updated);
        }
      } catch (err) {
        console.error('Failed to delete SME:', err);
      }
    }
  };

  const handleEditSME = (sme: SMEProfile) => {
    setFormData({
      name: sme.name,
      email: sme.email,
      expertise: sme.expertise.join(', '),
      biography: sme.biography || '',
      capacityHoursPerMonth: sme.capacityHoursPerMonth,
    });
    setEditingId(sme.id);
    setShowForm(true);
  };

  if (wsLoading || loading) {
    return (
      <div className="min-h-screen bg-parchment p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-lg">Loading SME profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink-950 mb-2">Subject Matter Experts</h1>
          <p className="text-lg text-slate-600">Manage your SME network and expertise areas</p>
        </div>

        {/* Navigation */}
        <div className="mb-6 flex gap-3">
          <Link
            href={strategyId ? `/topics?strategyId=${strategyId}` : '/topics'}
            className="btn-secondary text-sm"
          >
            ← Back to Topics
          </Link>
        </div>

        {/* Add SME Form */}
        <div className="mb-8 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">{editingId ? 'Edit SME Profile' : 'Add SME Profile'}</h3>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setFormData({
                  name: '',
                  email: '',
                  expertise: '',
                  biography: '',
                  capacityHoursPerMonth: 10,
                });
                setError('');
              }}
              className="btn-secondary text-sm"
            >
              {showForm ? '✕ Cancel' : '+ New SME'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddSME} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Jane Smith"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Expertise Areas (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  placeholder="e.g., API Design, Backend Architecture, DevOps"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Biography
                </label>
                <textarea
                  value={formData.biography}
                  onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                  placeholder="Brief bio of expertise and experience..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Available Hours Per Month
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacityHoursPerMonth}
                  onChange={(e) =>
                    setFormData({ ...formData, capacityHoursPerMonth: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      email: '',
                      expertise: '',
                      biography: '',
                      capacityHoursPerMonth: 10,
                    });
                    setError('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingId ? 'Updating...' : 'Adding...'}
                    </>
                  ) : editingId ? (
                    '✓ Update SME'
                  ) : (
                    '✓ Add SME'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* SME List */}
        {smes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {smes.map((sme) => (
              <div key={sme.id} className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink-950">{sme.name}</h3>
                    <p className="text-sm text-slate-600">{sme.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSME(sme)}
                      className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-all"
                      title="Edit SME"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSME(sme.id)}
                      className="p-2 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-all"
                      title="Delete SME"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expertise */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Expertise:</p>
                  <div className="flex flex-wrap gap-2">
                    {sme.expertise.map((exp, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Biography */}
                {sme.biography && (
                  <p className="text-sm text-slate-600 mb-3 italic">{sme.biography}</p>
                )}

                {/* Capacity */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-slate-600">Capacity</p>
                    <p className="font-semibold text-ink-950">{sme.capacityHoursPerMonth} hrs/mo</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-slate-600">Hours Used</p>
                    <p className="font-semibold text-ink-950">{sme.hoursUsed || 0} hrs</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-slate-600">Available</p>
                    <p className="font-semibold text-ink-950">
                      {sme.capacityHoursPerMonth - (sme.hoursUsed || 0)} hrs
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No SME profiles yet</div>
            <div className="empty-state-description">Add your first subject matter expert</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SMEPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SMEContent />
    </Suspense>
  );
}
