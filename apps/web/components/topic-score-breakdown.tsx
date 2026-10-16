'use client';

import React, { useState } from 'react';
import { TopicScoreBreakdown } from '@blog-agent/domain';
import { DIMENSION_EXPLANATIONS } from '@blog-agent/domain';

interface TopicScoreBreakdownProps {
  breakdown: TopicScoreBreakdown;
  finalScore: number;
  explanation: string;
}

export function TopicScoreBreakdownComponent({
  breakdown,
  finalScore,
  explanation,
}: TopicScoreBreakdownProps) {
  const [tooltipId, setTooltipId] = useState<string | null>(null);

  // Map breakdown keys to DIMENSION_EXPLANATIONS keys
  const dimensionMap: Record<string, string> = {
    strategicRelevance: 'strategicRelevance',
    audienceIcpUsefulness: 'audienceIcpUsefulness',
    availableEvidenceAndDemand: 'availableEvidenceAndDemand',
    differentiatedAngle: 'differentiatedAngle',
    smeFit: 'smeFit',
    searchContentGap: 'searchContentGap',
    conversionDistributionPotential: 'conversionDistributionPotential',
  };

  const dimensions = Object.entries(breakdown).map(([key, value]) => ({
    key,
    dimensionKey: dimensionMap[key],
    score: value.score,
    evidence: value.evidence,
    weight: DIMENSION_EXPLANATIONS[dimensionMap[key]]?.weight || 0,
    data: value.data,
  }));

  return (
    <div className="space-y-6">
      {/* Final Score Card */}
      <div className="bg-gradient-to-br from-signal to-azure rounded-lg p-8 text-center">
        <div className="text-6xl font-bold text-ink-950 mb-2">{finalScore}</div>
        <div className="text-sm font-medium text-ink-950 mb-4">Topic Score</div>

        {/* Score Explanation */}
        <p className="text-sm text-ink-900 leading-relaxed max-w-2xl mx-auto">{explanation}</p>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-ink-950 mb-4">Scoring Breakdown</h3>

        {dimensions.map((dim) => {
          const info = DIMENSION_EXPLANATIONS[dim.dimensionKey];
          const isTooltipOpen = tooltipId === dim.dimensionKey;

          return (
            <div key={dim.key} className="relative">
              {/* Dimension Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-950 text-sm">{info.name}</span>

                  {/* Info Icon with Tooltip */}
                  <div className="relative group">
                    <button
                      onMouseEnter={() => setTooltipId(dim.dimensionKey)}
                      onMouseLeave={() => setTooltipId(null)}
                      className="relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-signal/20 hover:bg-signal/30 transition-colors group"
                      title={info.description}
                    >
                      <span className="text-xs font-bold text-signal">?</span>
                    </button>

                    {/* Tooltip */}
                    {isTooltipOpen && (
                      <div className="absolute left-0 bottom-full mb-2 w-72 bg-ink-950 text-parchment rounded-lg p-3 shadow-lg z-50 before:content-[''] before:absolute before:top-full before:left-4 before:w-2 before:h-2 before:bg-ink-950 before:rotate-45">
                        <p className="font-bold text-sm mb-2">{info.description}</p>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-semibold">📈 High Scores (70-100):</span>
                            <p className="text-parchment/90 mt-1">{info.howScoredHigh}</p>
                          </div>
                          <div>
                            <span className="font-semibold">⚠️ Mid Scores (40-70):</span>
                            <p className="text-parchment/90 mt-1">{info.howScoredMid}</p>
                          </div>
                          <div>
                            <span className="font-semibold">❌ Low Scores (0-40):</span>
                            <p className="text-parchment/90 mt-1">{info.howScoredLow}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weight Badge */}
                  <span className="inline-block px-2 py-0.5 bg-pewter-slate/20 rounded text-xs font-medium text-ink-700">
                    {dim.weight}%
                  </span>
                </div>

                {/* Score */}
                <div
                  className={`flex items-center gap-2 font-bold ${
                    dim.score >= 80
                      ? 'text-signal-600'
                      : dim.score >= 65
                        ? 'text-oxidised-copper'
                        : 'text-ember-orange'
                  }`}
                >
                  <span className="text-lg">{dim.score}</span>
                  <span className="text-xs text-ink-700">/100</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-pewter-slate/20 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    dim.score >= 80
                      ? 'bg-signal-600'
                      : dim.score >= 65
                        ? 'bg-oxidised-copper'
                        : 'bg-ember-orange'
                  }`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>

              {/* Evidence Text */}
              <p className="text-xs text-ink-700 mt-2">{dim.evidence}</p>

              {/* Additional Data (if present) */}
              {dim.data && (
                <div className="mt-2 text-xs text-ink-600 space-y-1">
                  {Object.entries(dim.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold">
                        {typeof value === 'number' ? `${Math.round(value as number)}%` : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scoring Guidelines */}
      <div className="bg-pewter-slate/10 border border-pewter-slate/30 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-ink-950 mb-3 text-sm">Scoring Guidelines</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-signal-600"></div>
            <span>
              <strong>80-100:</strong> Excellent, ready to queue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-oxidised-copper"></div>
            <span>
              <strong>65-80:</strong> Good, can improve
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-ember-orange"></div>
            <span>
              <strong>50-65:</strong> Fair, needs work
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span>
              <strong>&lt;50:</strong> Low, revise topic
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
