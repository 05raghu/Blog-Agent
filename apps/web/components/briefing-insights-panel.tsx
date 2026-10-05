'use client';

import { BriefingInsights } from '@/lib/briefing-insights';

interface BriefingInsightsPanelProps {
  insights?: BriefingInsights;
  smeName?: string;
}

export function BriefingInsightsPanel({ insights, smeName = 'SME' }: BriefingInsightsPanelProps) {
  if (!insights || Object.keys(insights).length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">No briefing insights available for this article</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-bold text-slate-900 mb-3">📋 SME Briefing Insights from {smeName}</h3>
        <p className="text-xs text-slate-600">Extracted from completed briefing session</p>
      </div>

      {/* Positions / Viewpoints */}
      {insights.positions && insights.positions.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-slate-900 mb-2">🎯 Key Positions</h4>
          <div className="space-y-2">
            {insights.positions.map((pos, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="text-xs text-blue-700 font-medium mb-1">Q: {pos.question}</p>
                <p className="text-slate-700">{pos.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {insights.examples && insights.examples.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-slate-900 mb-2">📚 Examples & Case Studies</h4>
          <div className="space-y-2">
            {insights.examples.map((ex, idx) => (
              <div key={idx} className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                <p className="text-xs text-green-700 font-medium mb-1">
                  {ex.type === 'case_study' ? '📌 Case Study' : '🔍 Real-World Example'}: {ex.question}
                </p>
                <p className="text-slate-700">{ex.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Caveats */}
      {insights.caveats && insights.caveats.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-slate-900 mb-2">⚠️ Caveats & Risks</h4>
          <div className="space-y-2">
            {insights.caveats.map((cav, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                <p className="text-xs text-amber-700 font-medium mb-1">Q: {cav.question}</p>
                <p className="text-slate-700">{cav.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-slate-900 mb-2">✅ Recommendations</h4>
          <div className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-purple-50 border border-purple-200 rounded p-3 text-sm">
                <p className="text-xs text-purple-700 font-medium mb-1">Q: {rec.question}</p>
                <p className="text-slate-700">{rec.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quotable Insights */}
      {insights.quotable && insights.quotable.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-slate-900 mb-2">💬 Quotable Insights</h4>
          <div className="space-y-2">
            {insights.quotable.map((quote, idx) => (
              <div key={idx} className="bg-slate-100 border-l-4 border-slate-400 p-3 text-sm italic">
                <p className="text-slate-700 mb-1">&ldquo;{quote.answer}&rdquo;</p>
                <p className="text-xs text-slate-600">From: {quote.question}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {insights.gaps && insights.gaps.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <h4 className="font-semibold text-sm text-slate-900 mb-2">🔍 Unanswered Questions</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            {insights.gaps.map((gap, idx) => (
              <li key={idx} className="flex gap-2">
                <span>•</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
