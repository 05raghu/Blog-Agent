'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VoiceProfile {
  id: string;
  principles: string[];
  desiredPatterns: string[];
  prohibitedPatterns: string[];
  terminology: Record<string, string>;
  toneBoundaries: string[];
  exemplars: {
    strong: string[];
    weak: string[];
  };
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export default function BrandPage() {
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  const [formData, setFormData] = useState({
    principles: [] as string[],
    desiredPatterns: [] as string[],
    prohibitedPatterns: [] as string[],
    terminology: {} as Record<string, string>,
    toneBoundaries: [] as string[],
    strongExemplars: [] as string[],
    weakExemplars: [] as string[],
  });

  const [newPrinciple, setNewPrinciple] = useState('');
  const [newDesiredPattern, setNewDesiredPattern] = useState('');
  const [newProhibitedPattern, setNewProhibitedPattern] = useState('');
  const [newTerm, setNewTerm] = useState('');
  const [newTermExplanation, setNewTermExplanation] = useState('');
  const [newToneBoundary, setNewToneBoundary] = useState('');
  const [newStrongExemplar, setNewStrongExemplar] = useState('');
  const [newWeakExemplar, setNewWeakExemplar] = useState('');

  useEffect(() => {
    fetchVoiceProfile();
  }, []);

  const fetchVoiceProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/brand/voice-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setVoiceProfile(data.profile);
          setFormData({
            principles: data.profile.principles || [],
            desiredPatterns: data.profile.desiredPatterns || [],
            prohibitedPatterns: data.profile.prohibitedPatterns || [],
            terminology: data.profile.terminology || {},
            toneBoundaries: data.profile.toneBoundaries || [],
            strongExemplars: data.profile.exemplars?.strong || [],
            weakExemplars: data.profile.exemplars?.weak || [],
          });
        }
      }
    } catch (err) {
      setError('Failed to load voice profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (approved: boolean = false) => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/brand/voice-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principles: formData.principles,
          desiredPatterns: formData.desiredPatterns,
          prohibitedPatterns: formData.prohibitedPatterns,
          terminology: formData.terminology,
          toneBoundaries: formData.toneBoundaries,
          exemplars: {
            strong: formData.strongExemplars,
            weak: formData.weakExemplars,
          },
          approved,
          approvedBy: approved ? 'admin' : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save voice profile');
      }

      const data = await response.json();
      setVoiceProfile(data.profile);
      const msg = approved ? '✓ Voice profile approved!' : '✓ Voice profile saved successfully';
      setSuccess(msg);
      setShowEditForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickApprove = async () => {
    if (!voiceProfile) return;
    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/brand/voice-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principles: voiceProfile.principles,
          desiredPatterns: voiceProfile.desiredPatterns,
          prohibitedPatterns: voiceProfile.prohibitedPatterns,
          terminology: voiceProfile.terminology,
          toneBoundaries: voiceProfile.toneBoundaries,
          exemplars: voiceProfile.exemplars,
          approved: true,
          approvedBy: 'admin',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve voice profile');
      }

      const data = await response.json();
      setVoiceProfile(data.profile);
      setSuccess('✓ Voice profile approved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addPrinciple = () => {
    if (newPrinciple.trim()) {
      setFormData({
        ...formData,
        principles: [...formData.principles, newPrinciple],
      });
      setNewPrinciple('');
    }
  };

  const removePrinciple = (index: number) => {
    setFormData({
      ...formData,
      principles: formData.principles.filter((_, i) => i !== index),
    });
  };

  const addDesiredPattern = () => {
    if (newDesiredPattern.trim()) {
      setFormData({
        ...formData,
        desiredPatterns: [...formData.desiredPatterns, newDesiredPattern],
      });
      setNewDesiredPattern('');
    }
  };

  const removeDesiredPattern = (index: number) => {
    setFormData({
      ...formData,
      desiredPatterns: formData.desiredPatterns.filter((_, i) => i !== index),
    });
  };

  const addProhibitedPattern = () => {
    if (newProhibitedPattern.trim()) {
      setFormData({
        ...formData,
        prohibitedPatterns: [...formData.prohibitedPatterns, newProhibitedPattern],
      });
      setNewProhibitedPattern('');
    }
  };

  const removeProhibitedPattern = (index: number) => {
    setFormData({
      ...formData,
      prohibitedPatterns: formData.prohibitedPatterns.filter((_, i) => i !== index),
    });
  };

  const addTerm = () => {
    if (newTerm.trim() && newTermExplanation.trim()) {
      setFormData({
        ...formData,
        terminology: {
          ...formData.terminology,
          [newTerm]: newTermExplanation,
        },
      });
      setNewTerm('');
      setNewTermExplanation('');
    }
  };

  const removeTerm = (term: string) => {
    const updated = { ...formData.terminology };
    delete updated[term];
    setFormData({ ...formData, terminology: updated });
  };

  const addToneBoundary = () => {
    if (newToneBoundary.trim()) {
      setFormData({
        ...formData,
        toneBoundaries: [...formData.toneBoundaries, newToneBoundary],
      });
      setNewToneBoundary('');
    }
  };

  const removeToneBoundary = (index: number) => {
    setFormData({
      ...formData,
      toneBoundaries: formData.toneBoundaries.filter((_, i) => i !== index),
    });
  };

  const addStrongExemplar = () => {
    if (newStrongExemplar.trim()) {
      setFormData({
        ...formData,
        strongExemplars: [...formData.strongExemplars, newStrongExemplar],
      });
      setNewStrongExemplar('');
    }
  };

  const removeStrongExemplar = (index: number) => {
    setFormData({
      ...formData,
      strongExemplars: formData.strongExemplars.filter((_, i) => i !== index),
    });
  };

  const addWeakExemplar = () => {
    if (newWeakExemplar.trim()) {
      setFormData({
        ...formData,
        weakExemplars: [...formData.weakExemplars, newWeakExemplar],
      });
      setNewWeakExemplar('');
    }
  };

  const removeWeakExemplar = (index: number) => {
    setFormData({
      ...formData,
      weakExemplars: formData.weakExemplars.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin mb-4 text-4xl">⚙</div>
            <p className="text-lg font-medium">Loading brand guidelines...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-hero mb-4" style={{ fontSize: '46px' }}>
            Brand Guidelines
          </h1>
          <p className="lead text-slate-700">
            Define your voice profile, principles, and writing exemplars to align all content with your brand
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* View Mode */}
        {!showEditForm && (
          <div className="bg-white rounded-lg border border-slate-200 p-8 space-y-8">
            {voiceProfile ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Current Voice Profile</h2>
                    <span className={`text-xs font-semibold px-3 py-1 rounded ${
                      voiceProfile.approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {voiceProfile.approved ? '✓ Approved' : '⏳ Pending Approval'}
                    </span>
                  </div>
                </div>

                {voiceProfile.principles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Principles</h3>
                    <ul className="space-y-2">
                      {voiceProfile.principles.map((p, i) => (
                        <li key={i} className="text-sm text-slate-700">• {p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {voiceProfile.desiredPatterns.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Desired Patterns</h3>
                    <ul className="space-y-2">
                      {voiceProfile.desiredPatterns.map((p, i) => (
                        <li key={i} className="text-sm text-slate-700">✓ {p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {voiceProfile.prohibitedPatterns.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Prohibited Patterns</h3>
                    <ul className="space-y-2">
                      {voiceProfile.prohibitedPatterns.map((p, i) => (
                        <li key={i} className="text-sm text-slate-700">✗ {p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Object.keys(voiceProfile.terminology).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Terminology</h3>
                    <div className="space-y-2">
                      {Object.entries(voiceProfile.terminology).map(([term, explanation], i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium text-slate-900">{term}</span>
                          <span className="text-slate-600"> — {explanation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {voiceProfile.toneBoundaries.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Tone Boundaries</h3>
                    <ul className="space-y-2">
                      {voiceProfile.toneBoundaries.map((t, i) => (
                        <li key={i} className="text-sm text-slate-700">• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {voiceProfile.exemplars.strong.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Strong Writing Examples</h3>
                    <div className="space-y-2">
                      {voiceProfile.exemplars.strong.map((e, i) => (
                        <p key={i} className="text-sm text-slate-700 bg-green-50 p-3 rounded border border-green-200">
                          "{e}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {voiceProfile.exemplars.weak.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Weak Writing Examples (to avoid)</h3>
                    <div className="space-y-2">
                      {voiceProfile.exemplars.weak.map((e, i) => (
                        <p key={i} className="text-sm text-slate-700 bg-red-50 p-3 rounded border border-red-200">
                          "{e}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-600 text-center py-8">No voice profile defined yet. Click below to create one.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditForm(true)}
                className="btn-primary flex-1"
              >
                {voiceProfile ? '✏️ Edit Voice Profile' : '+ Create Voice Profile'}
              </button>
              {voiceProfile && !voiceProfile.approved && (
                <button
                  onClick={handleQuickApprove}
                  disabled={saving}
                  className="btn-primary bg-green-600 hover:bg-green-700 flex-1"
                >
                  {saving ? '✓ Approving...' : '✓ Approve'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Edit Form */}
        {showEditForm && (
          <div className="bg-white rounded-lg border border-slate-200 p-8 space-y-8">
            {/* Principles */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Principles</h3>
              <div className="space-y-2 mb-3">
                {formData.principles.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded">
                    <span className="text-sm text-slate-700">{p}</span>
                    <button
                      onClick={() => removePrinciple(i)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPrinciple}
                  onChange={(e) => setNewPrinciple(e.target.value)}
                  placeholder="e.g., Always back claims with evidence"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addPrinciple()}
                />
                <button onClick={addPrinciple} className="btn-secondary text-sm">
                  Add
                </button>
              </div>
            </div>

            {/* Desired Patterns */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Desired Patterns</h3>
              <div className="space-y-2 mb-3">
                {formData.desiredPatterns.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-green-50 p-3 rounded">
                    <span className="text-sm text-slate-700">✓ {p}</span>
                    <button
                      onClick={() => removeDesiredPattern(i)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDesiredPattern}
                  onChange={(e) => setNewDesiredPattern(e.target.value)}
                  placeholder="e.g., Use specific examples over generalizations"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addDesiredPattern()}
                />
                <button onClick={addDesiredPattern} className="btn-secondary text-sm">
                  Add
                </button>
              </div>
            </div>

            {/* Prohibited Patterns */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Prohibited Patterns</h3>
              <div className="space-y-2 mb-3">
                {formData.prohibitedPatterns.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-red-50 p-3 rounded">
                    <span className="text-sm text-slate-700">✗ {p}</span>
                    <button
                      onClick={() => removeProhibitedPattern(i)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProhibitedPattern}
                  onChange={(e) => setNewProhibitedPattern(e.target.value)}
                  placeholder="e.g., Avoid marketing buzzwords like 'revolutionary'"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addProhibitedPattern()}
                />
                <button onClick={addProhibitedPattern} className="btn-secondary text-sm">
                  Add
                </button>
              </div>
            </div>

            {/* Terminology */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Terminology</h3>
              <div className="space-y-2 mb-3">
                {Object.entries(formData.terminology).map(([term, explanation], i) => (
                  <div key={i} className="flex justify-between items-start bg-slate-50 p-3 rounded">
                    <div>
                      <span className="font-medium text-slate-900">{term}</span>
                      <p className="text-xs text-slate-600">{explanation}</p>
                    </div>
                    <button
                      onClick={() => removeTerm(term)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="e.g., 'data integration'"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={newTermExplanation}
                  onChange={(e) => setNewTermExplanation(e.target.value)}
                  placeholder="Explanation"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addTerm()}
                />
                <button onClick={addTerm} className="btn-secondary text-sm w-full">
                  Add Term
                </button>
              </div>
            </div>

            {/* Tone Boundaries */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">Tone Boundaries</h3>
              <div className="space-y-2 mb-3">
                {formData.toneBoundaries.map((t, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded">
                    <span className="text-sm text-slate-700">{t}</span>
                    <button
                      onClick={() => removeToneBoundary(i)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newToneBoundary}
                  onChange={(e) => setNewToneBoundary(e.target.value)}
                  placeholder="e.g., Professional but approachable"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addToneBoundary()}
                />
                <button onClick={addToneBoundary} className="btn-secondary text-sm">
                  Add
                </button>
              </div>
            </div>

            {/* Strong Exemplars */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">✓ Strong Writing Examples</h3>
              <div className="space-y-2 mb-3">
                {formData.strongExemplars.map((e, i) => (
                  <div key={i} className="flex justify-between items-start bg-green-50 p-3 rounded">
                    <span className="text-sm text-slate-700">"{e}"</span>
                    <button
                      onClick={() => removeStrongExemplar(i)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStrongExemplar}
                  onChange={(e) => setNewStrongExemplar(e.target.value)}
                  placeholder="Paste an example of great writing"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addStrongExemplar()}
                />
                <button onClick={addStrongExemplar} className="btn-secondary text-sm">
                  Add
                </button>
              </div>
            </div>

            {/* Weak Exemplars */}
            <div>
              <h3 className="font-bold text-slate-900 mb-3">✗ Weak Writing Examples (to avoid)</h3>
              <div className="space-y-2 mb-3">
                {formData.weakExemplars.map((e, i) => (
                  <div key={i} className="flex justify-between items-start bg-red-50 p-3 rounded">
                    <span className="text-sm text-slate-700">"{e}"</span>
                    <button
                      onClick={() => removeWeakExemplar(i)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWeakExemplar}
                  onChange={(e) => setNewWeakExemplar(e.target.value)}
                  placeholder="Paste an example to avoid"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addWeakExemplar()}
                />
                <button onClick={addWeakExemplar} className="btn-secondary text-sm">
                  Add
                </button>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => handleSaveProfile(false)}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? '💾 Saving...' : '💾 Save Voice Profile'}
              </button>
              <button
                onClick={() => handleSaveProfile(true)}
                disabled={saving}
                className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
              >
                {saving ? '✓ Approving...' : '✓ Save & Approve'}
              </button>
              <button
                onClick={() => setShowEditForm(false)}
                disabled={saving}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/strategy" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Strategies
          </Link>
        </div>
      </div>
    </div>
  );
}
