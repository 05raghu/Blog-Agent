'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';

export default function CreateStrategyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useWorkspace();

  // All hooks must be called at top level, before any returns
  const [step, setStep] = useState<'input' | 'generating' | 'success'>('input');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [offerings, setOfferings] = useState('');
  const [targetIcps, setTargetIcps] = useState('');
  const [geographies, setGeographies] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [contentMix, setContentMix] = useState('');
  const [description, setDescription] = useState('');
  const [strategyId, setStrategyId] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('generating');

    try {
      const response = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'My Strategy',
          offerings: offerings.split(',').map((s) => s.trim()).filter(Boolean),
          targetIcps: targetIcps.split(',').map((s) => s.trim()).filter(Boolean),
          geographies: geographies.split(',').map((s) => s.trim()).filter(Boolean),
          competitors: competitors.split(',').map((s) => s.trim()).filter(Boolean),
          contentMix: parseContentMix(contentMix),
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create strategy');
      }

      const data = await response.json();
      setStrategyId(data.id);

      // Store strategy data in localStorage for topics page to use
      localStorage.setItem(`strategy_${data.id}`, JSON.stringify({
        id: data.id,
        title: data.title,
        offerings: data.offerings,
        targetIcps: data.targetIcps,
        geographies: data.geographies,
        competitors: data.competitors,
        contentMix: data.contentMix,
      }));

      setStep('success');
    } catch (err) {
      setError((err as Error).message);
      setStep('input');
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

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-hero mb-4" style={{ fontSize: '46px' }}>
            Create Editorial Strategy
          </h1>
          <p className="lead text-slate-700">
            Define your content strategy and generate high-scoring topic candidates
          </p>
        </div>

        {/* Input Phase */}
        {step === 'input' && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="error-message">
                <span className="error-message-icon">⚠</span>
                <span className="error-message-text">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Strategy Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError('');
                }}
                placeholder="e.g., Codewave 2026 Editorial"
                style={{ borderRadius: '10px' }}
                className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Offerings * (comma-separated)
              </label>
              <textarea
                value={offerings}
                onChange={(e) => {
                  setOfferings(e.target.value);
                  setError('');
                }}
                placeholder="e.g., API Platform, Data Integration, Analytics Engine"
                rows={3}
                style={{ borderRadius: '10px' }}
                className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal font-body"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target ICPs (comma-separated)
              </label>
              <textarea
                value={targetIcps}
                onChange={(e) => {
                  setTargetIcps(e.target.value);
                  setError('');
                }}
                placeholder="e.g., Engineering leaders at mid-market SaaS, VP of Data"
                rows={3}
                style={{ borderRadius: '10px' }}
                className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Geographies (comma-separated)
              </label>
              <input
                type="text"
                value={geographies}
                onChange={(e) => {
                  setGeographies(e.target.value);
                  setError('');
                }}
                placeholder="e.g., US, EU, APAC"
                style={{ borderRadius: '10px' }}
                className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Competitors (comma-separated)
              </label>
              <input
                type="text"
                value={competitors}
                onChange={(e) => {
                  setCompetitors(e.target.value);
                  setError('');
                }}
                placeholder="e.g., Zapier, Make, n8n"
                style={{ borderRadius: '10px' }}
                className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Content Mix (key:value; format)
              </label>
              <textarea
                value={contentMix}
                onChange={(e) => {
                  setContentMix(e.target.value);
                  setError('');
                }}
                placeholder="e.g., how-to:30; thought-leadership:40; case-study:30"
                rows={2}
                style={{ borderRadius: '10px' }}
                className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal font-body text-xs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError('');
                }}
                placeholder="Optional: Describe your editorial philosophy..."
                rows={3}
                style={{ borderRadius: '10px' }}
                className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal font-body"
              />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary">
                Save Strategy & Generate Topics
              </button>
              <Link href="/strategy" className="btn-secondary">
                Back to Strategies
              </Link>
            </div>
          </form>
        )}

        {/* Generating Phase */}
        {step === 'generating' && (
          <div className="text-center py-12">
            <div className="animate-spin mb-4">⚙</div>
            <p className="text-lg font-medium mb-2">Generating topic candidates...</p>
            <p className="text-sm text-slate-600">
              This may take a few seconds
            </p>
          </div>
        )}

        {/* Success Phase */}
        {step === 'success' && (
          <div className="space-y-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <div className="text-center">
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  Strategy Created Successfully!
                </h2>
                <p className="text-green-700 mb-6">
                  Your strategy ID: <code className="font-mono text-sm">{strategyId.substring(0, 20)}...</code>
                </p>

                <div className="flex gap-4 justify-center">
                  <Link href={`/topics?strategyId=${strategyId}`} className="btn-primary">
                    View Topic Candidates →
                  </Link>
                  <button
                    onClick={() => {
                      router.push('/strategy');
                    }}
                    className="btn-secondary"
                  >
                    Back to All Strategies
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
