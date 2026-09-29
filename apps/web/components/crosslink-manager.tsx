'use client';

import { useState, useEffect } from 'react';

interface SuggestedLink {
  id: string;
  title: string;
  similarity?: number; // Legacy: keyword-based
  relevance?: number; // New: LLM-based (0-100)
  suggestedAnchor: string;
  rationale?: string; // New: LLM-provided reason
}

interface CrosslinkManagerProps {
  articleId: string;
  title: string;
  content: string;
  strategyId: string;
  onSuggest: () => Promise<void>;
  onContentUpdate?: (newContent: string) => Promise<void>;
  isLoading?: boolean;
  suggestions?: SuggestedLink[];
  linkedCount?: number;
}

export function CrosslinkManager({
  articleId,
  title,
  content,
  strategyId,
  onSuggest,
  onContentUpdate,
  isLoading = false,
  suggestions = [],
  linkedCount = 0,
}: CrosslinkManagerProps) {
  // Load approved state from localStorage
  const [approved, setApproved] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`crosslinks_${articleId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [inserting, setInserting] = useState(false);

  // Update localStorage when approved changes
  const updateApproved = (newApproved: Record<string, boolean>) => {
    setApproved(newApproved);
    localStorage.setItem(`crosslinks_${articleId}`, JSON.stringify(newApproved));
  };

  const handleSuggest = async () => {
    await onSuggest();
  };

  // Auto-detect which suggested links are already in content
  useEffect(() => {
    if (suggestions.length > 0 && content) {
      const detectedLinks: Record<string, boolean> = {};
      suggestions.forEach((link) => {
        if (content.includes(`/articles/${link.id}`)) {
          detectedLinks[link.id] = true;
        }
      });

      if (Object.keys(detectedLinks).length > 0) {
        updateApproved({ ...approved, ...detectedLinks });
      }
    }
  }, [suggestions, content]);

  const handleAddLink = async (linkId: string, title: string, anchor: string) => {
    try {
      setInserting(true);
      const response = await fetch(`/api/articles/${articleId}/add-crosslink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetArticleId: linkId,
          targetTitle: title,
          anchorText: anchor,
        }),
      });

      if (!response.ok) throw new Error('Failed to add link');

      const data = await response.json();
      updateApproved({ ...approved, [linkId]: true });

      // Save updated content to backend
      if (onContentUpdate && data.content) {
        await onContentUpdate(data.content);
      }
    } catch (err) {
      console.error('Error adding link:', err);
    } finally {
      setInserting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {linkedCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-800">
            ✓ {linkedCount} internal link{linkedCount !== 1 ? 's' : ''} added to article
          </p>
        </div>
      )}

      {/* Suggest Button */}
      {suggestions.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-slate-600 mb-4">
            Find related articles from your content strategy and add cross-links to improve SEO and content discovery
          </p>
          <button
            onClick={handleSuggest}
            disabled={isLoading || !content || !title}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing Articles...
              </>
            ) : (
              '🔗 Find Related Articles'
            )}
          </button>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Suggested Links</h3>
            <button
              onClick={handleSuggest}
              disabled={isLoading}
              className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="space-y-3">
            {suggestions.map((link) => (
              <div
                key={link.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-3">
                  {/* Link Title & Relevance Score */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{link.title}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Suggested anchor: "{link.suggestedAnchor}"
                      </p>
                      {link.rationale && (
                        <p className="text-xs text-slate-500 mt-2 italic">
                          {link.rationale}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${(link.relevance || link.similarity || 0)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 min-w-8">
                        {Math.round(link.relevance || link.similarity || 0)}%
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {approved[link.id] ? (
                      <button
                        disabled
                        className="px-3 py-2 bg-green-50 text-green-700 rounded text-sm font-semibold border border-green-200 cursor-default"
                      >
                        ✓ Added
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAddLink(link.id, link.title, link.suggestedAnchor)}
                          disabled={inserting}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {inserting ? '⏳ Adding...' : '+ Add Link'}
                        </button>
                        <button className="px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors">
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-600">
              {Object.values(approved).filter(Boolean).length} of {suggestions.length} links approved
            </p>
          </div>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center space-y-4">
          <p className="text-slate-600">
            No related articles found in your content strategy
          </p>
          <div className="bg-white border border-slate-200 rounded p-4 text-left text-sm">
            <p className="font-semibold text-slate-900 mb-2">✓ To see cross-linking suggestions:</p>
            <ul className="text-slate-700 space-y-1">
              <li>• Create 2+ articles in the same strategy</li>
              <li>• Articles need similar topics or keywords</li>
              <li>• Minimum 40% content similarity required</li>
            </ul>
          </div>
          <button
            onClick={handleSuggest}
            disabled={isLoading}
            className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            🔄 Refresh & Check Again
          </button>
        </div>
      )}
    </div>
  );
}
