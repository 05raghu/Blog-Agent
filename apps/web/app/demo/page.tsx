'use client';

import { useState } from 'react';

export default function DemoPage() {
  const [step, setStep] = useState<'input' | 'generating' | 'generated' | 'critique'>('input');
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [outline, setOutline] = useState('');
  const [draft, setDraft] = useState('');
  const [draftId, setDraftId] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [score, setScore] = useState(0);
  const [issues, setIssues] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Example brief and outline for quick demo
  const loadExample = () => {
    setTitle('The Future of AI in Enterprise Software');
    setBrief(
      'Explore how enterprise software teams are adopting AI to improve developer productivity. Focus on real-world implementations and measurable outcomes.'
    );
    setOutline(`
1. Introduction - Current state of AI adoption in enterprise
2. Key Challenges - Security, integration, cost concerns
3. Success Stories - 3 real examples (case studies)
4. Practical Implementation - Step-by-step guide
5. ROI & Metrics - How to measure success
6. Roadmap - What's coming next
7. Conclusion & Next Steps
    `);
    setError(''); // Clear error when loading example
  };

  const handleClearForm = () => {
    setTitle('');
    setBrief('');
    setOutline('');
    setError('');
  };

  const handleGenerateDraft = async () => {
    if (!title.trim() || !brief.trim() || !outline.trim()) {
      setError('Please enter title, brief, and outline');
      return;
    }

    setStep('generating');
    setError('');

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled',
          brief,
          outline,
          targetLength: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate draft');
      }

      const data = await response.json();
      setDraft(data.content);
      setDraftId(data.draftId);
      setWordCount(data.wordCount);
      setStep('generated');
    } catch (err) {
      setError((err as Error).message);
      setStep('input');
    }
  };

  const handleGetCritique = async () => {
    try {
      const response = await fetch('/api/drafts/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });

      if (!response.ok) {
        throw new Error('Failed to get critique');
      }

      const data = await response.json();
      setScore(data.score);
      setIssues(data.issues);
      setSuggestions(data.suggestions);
      setStep('critique');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-hero mb-4" style={{ fontSize: '40px' }}>Blog Agent MVP</h1>
          {/* <p className="lead text-signal mb-2">Generate blog drafts with AI</p> */}
          {/* <p className="text-sm text-slate-600">
            {isLiveMode ? '✨ Live Claude API mode' : '🧪 Demo mode (mock responses)'}
          </p> */}
        </div>

        {/* Input Phase */}
        {step === 'input' && (
          <div className="space-y-8">
            {error && (
              <div className="error-message">
                <span className="error-message-icon">⚠</span>
                <span className="error-message-text">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Article Title *</label>
              <input
                style={{ borderRadius: "10px" }}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError('');
                }}
                placeholder="e.g., The Future of AI in Enterprise"
                className="w-full px-4 py-2 border border-ink-950 focus:ring-2 ring-signal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Brief *</label>
              <textarea
                style={{ borderRadius: "10px" }}
                value={brief}
                onChange={(e) => {
                  setBrief(e.target.value);
                  setError('');
                }}
                placeholder="Describe the article's topic, angle, and key message..."
                rows={4}
                className="w-full px-4 py-2 border border-ink-950  focus:ring-2 ring-signal font-body"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Outline *</label>
              <textarea
                style={{ borderRadius: "10px" }}
                value={outline}
                onChange={(e) => {
                  setOutline(e.target.value);
                  setError('');
                }}
                placeholder="Section headings and key points..."
                rows={6}
                className="w-full px-4 py-2 border border-ink-950  focus:ring-2 ring-signal font-body"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <button onClick={handleGenerateDraft} className="btn-primary">
                Generate Draft
              </button>
              <button onClick={loadExample} className="btn-secondary">
                Load Example
              </button>
              <button onClick={handleClearForm} className="btn-secondary">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Generating Phase */}
        {step === 'generating' && (
          <div className="text-center py-12">
            <div className="animate-spin mb-4">⚙</div>
            <p className="text-lg font-medium mb-2">Generating your draft...</p>
            <p className="text-sm text-slate-600">This may take 30-60 seconds</p>
          </div>
        )}

        {/* Generated Phase */}
        {step === 'generated' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-editorial">{title || 'Generated Draft'}</h2>
              <button
                onClick={() => setStep('input')}
                className="btn-secondary text-sm"
              >
                Start Over
              </button>
            </div>

            <div className="text-sm text-slate-600 mb-4">
              {wordCount} words • Generated just now {draftId && `(ID: ${draftId.substring(0, 12)}...)`}
            </div>

            {/* Draft Content */}
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="prose max-w-none font-body" style={{ whiteSpace: 'pre-wrap' }}>
                {draft}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button onClick={handleGetCritique} className="btn-primary">
                Get AI Critique
              </button>
              <button onClick={() => setStep('input')} className="btn-secondary">
                Generate New Draft
              </button>
            </div>
          </div>
        )}

        {/* Critique Phase */}
        {step === 'critique' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-editorial">Editorial Review</h2>
              <button
                onClick={() => setStep('generated')}
                className="btn-secondary text-sm"
              >
                Back to Draft
              </button>
            </div>

            {/* Score Card */}
            <div className="bg-gradient-to-r from-signal to-azure text-ink-950 rounded-lg p-8">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{score}</div>
                <div className="text-lg font-medium">Publish Readiness Score</div>
                <div className="text-sm mt-2">
                  {score >= 80
                    ? '✨ Ready to publish'
                    : score >= 65
                      ? '📝 Needs minor revisions'
                      : '🔄 Requires significant work'}
                </div>
              </div>
            </div>

            {/* Issues */}
            {issues.length > 0 && (
              <div>
                <h3 className="text-editorial mb-4">Issues Found</h3>
                <div className="space-y-3">
                  {issues.map((issue, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border-l-4 ${issue.severity === 'p0'
                        ? 'bg-red-50 border-red-400'
                        : issue.severity === 'p1'
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-blue-50 border-blue-400'
                        }`}
                    >
                      <div className="font-medium text-sm mb-1">
                        [{issue.severity.toUpperCase()}] {issue.category}
                      </div>
                      <div className="text-sm">{issue.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <h3 className="text-editorial mb-4">Suggestions for Improvement</h3>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="text-signal font-bold">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Actions */}
            <div className="flex gap-4">
              <button onClick={() => setStep('generated')} className="btn-primary">
                Revise Draft
              </button>
              <button onClick={() => setStep('input')} className="btn-secondary">
                Generate New Article
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {/* <div className="mt-16 pt-8 border-t border-slate-300 text-center text-sm text-slate-600">
          <p>🎯 Marketing Demo — Blog Agent V1</p>
          <p className="mt-1">
            {isLiveMode
              ? 'Using live Claude API for generation'
              : 'Using mock responses for demo (configure ANTHROPIC_API_KEY to use live)'}
          </p>
        </div> */}
      </div>
    </div>
  );
}
