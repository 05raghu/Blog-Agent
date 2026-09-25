'use client';

import { useState, useEffect } from 'react';

interface SEOAnalysis {
  score: number;
  keyword: string;
  keywordDensity: number;
  metaDescription: string;
  readabilityScore: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
  }>;
  suggestions: string[];
}

interface SEOAnalyzerProps {
  title: string;
  content: string;
  brief: string;
  onAnalyze: () => Promise<void>;
  isLoading?: boolean;
  analysis?: SEOAnalysis;
}

export function SEOAnalyzer({
  title,
  content,
  brief,
  onAnalyze,
  isLoading = false,
  analysis,
}: SEOAnalyzerProps) {
  const [showAnalysis, setShowAnalysis] = useState(!!analysis);

  // Auto-show analysis when it's loaded from backend
  useEffect(() => {
    if (analysis) {
      setShowAnalysis(true);
      console.log('[DEBUG] SEOAnalyzer: Auto-showing analysis from props');
    }
  }, [analysis]);

  const handleAnalyze = async () => {
    setShowAnalysis(true);
    await onAnalyze();
  };

  const scoreColor = analysis
    ? analysis.score >= 80
      ? 'text-green-700'
      : analysis.score >= 60
        ? 'text-amber-700'
        : 'text-red-700'
    : 'text-slate-700';

  const scoreBg = analysis
    ? analysis.score >= 80
      ? 'bg-green-50'
      : analysis.score >= 60
        ? 'bg-amber-50'
        : 'bg-red-50'
    : 'bg-slate-50';

  return (
    <div className="space-y-6">
      {/* Analyze Button */}
      {!showAnalysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-slate-600 mb-4">
            Run SEO analysis to optimize your article for search engines
          </p>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !content || !title}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              '🔍 Analyze SEO'
            )}
          </button>
        </div>
      )}

      {/* SEO Score Card */}
      {showAnalysis && analysis && (
        <div className={`${scoreBg} border border-slate-200 rounded-lg p-6`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">SEO Score</h3>
              <p className="text-sm text-slate-600">
                Optimization recommendations to improve search visibility
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${scoreColor}`}>{analysis.score}</div>
              <p className="text-xs text-slate-600 mt-1">/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Keyword Analysis */}
      {showAnalysis && analysis && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-slate-900">Primary Keyword</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-1">Keyword</p>
              <p className="text-lg font-semibold text-slate-900">{analysis.keyword}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Density</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      analysis.keywordDensity >= 1 && analysis.keywordDensity <= 3
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${Math.min(analysis.keywordDensity * 20, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900 min-w-12">
                  {analysis.keywordDensity.toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {analysis.keywordDensity >= 1 && analysis.keywordDensity <= 3
                  ? '✓ Optimal'
                  : analysis.keywordDensity < 1
                    ? '⚠️ Too low, add more mentions'
                    : '⚠️ Too high, reduce mentions'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Readability */}
      {showAnalysis && analysis && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-slate-900">Readability</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-1">Grade Level (Flesch-Kincaid)</p>
              <p className="text-lg font-semibold text-slate-900">Grade {analysis.readabilityScore}</p>
              <p className="text-xs text-slate-500 mt-1">
                {analysis.readabilityScore <= 8
                  ? '✓ Easy to read'
                  : analysis.readabilityScore <= 12
                    ? '✓ Good readability'
                    : '⚠️ Consider simplifying'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Meta Description */}
      {showAnalysis && analysis && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-slate-900">Meta Description</h3>
          <div className="space-y-2">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <p className="text-sm text-slate-700">{analysis.metaDescription}</p>
            </div>
            <p className="text-xs text-slate-600">
              {analysis.metaDescription.length}/160 characters
            </p>
          </div>
        </div>
      )}

      {/* Issues & Suggestions */}
      {showAnalysis && analysis && analysis.issues.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-slate-900">Issues</h3>
          <div className="space-y-2">
            {analysis.issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border-l-4 ${
                  issue.type === 'error'
                    ? 'bg-red-50 border-red-300'
                    : issue.type === 'warning'
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-blue-50 border-blue-300'
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{issue.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {showAnalysis && analysis && analysis.suggestions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-slate-900">Suggestions</h3>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-slate-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!showAnalysis && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <p className="text-slate-600">
            Click "Analyze SEO" to review keyword usage, readability, and meta descriptions
          </p>
        </div>
      )}
    </div>
  );
}
