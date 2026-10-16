'use client';

import React, { useState } from 'react';
import { LLMTopicScoreResult } from '@blog-agent/integrations';

interface LLMTopicScoreProps {
  score: LLMTopicScoreResult;
}

export function LLMTopicScoreComponent({ score }: LLMTopicScoreProps) {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 85) return 'text-signal-600';
    if (scoreValue >= 75) return 'text-oxidised-copper';
    if (scoreValue >= 65) return 'text-amber-600';
    return 'text-ember-orange';
  };

  const getProgressColor = (scoreValue: number) => {
    if (scoreValue >= 85) return 'bg-signal-600';
    if (scoreValue >= 75) return 'bg-oxidised-copper';
    if (scoreValue >= 65) return 'bg-amber-600';
    return 'bg-ember-orange';
  };

  const getRecommendationBg = (recommendation: string) => {
    if (recommendation.includes('immediately')) return 'bg-signal/10 border border-signal/30';
    if (recommendation.includes('Good')) return 'bg-oxidised-copper/10 border border-oxidised-copper/30';
    if (recommendation.includes('Fair')) return 'bg-amber-100 border border-amber-300';
    return 'bg-ember-orange/10 border border-ember-orange/30';
  };

  const dimensions = [
    {
      key: 'strategicRelevance',
      label: '🎯 Strategic Relevance',
      weight: 25,
      data: score.breakdown.strategicRelevance,
    },
    {
      key: 'audienceIcpUsefulness',
      label: '👥 Audience & ICP Fit',
      weight: 15,
      data: score.breakdown.audienceIcpUsefulness,
    },
    {
      key: 'availableEvidenceAndDemand',
      label: '📊 Evidence & Market Demand',
      weight: 15,
      data: score.breakdown.availableEvidenceAndDemand,
    },
    {
      key: 'differentiatedAngle',
      label: '💡 Differentiated Angle',
      weight: 15,
      data: score.breakdown.differentiatedAngle,
    },
    {
      key: 'smeFit',
      label: '👨‍🔬 SME Fit & Expertise',
      weight: 10,
      data: score.breakdown.smeFit,
    },
    {
      key: 'searchContentGap',
      label: '🔍 Search Gap & Demand',
      weight: 10,
      data: score.breakdown.searchContentGap,
    },
    {
      key: 'conversionDistributionPotential',
      label: '📈 Conversion & Distribution',
      weight: 10,
      data: score.breakdown.conversionDistributionPotential,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Final Score Card */}
      <div className="bg-gradient-to-br from-signal to-azure rounded-lg p-8 text-center">
        <div className="text-6xl font-bold text-ink-950 mb-2">{score.totalScore}</div>
        <div className="text-sm font-medium text-ink-950 mb-4">LLM-Generated Topic Score</div>

        {/* Recommendation */}
        <div className={`inline-block px-4 py-2 rounded-lg ${getRecommendationBg(score.overallRecommendation)}`}>
          <p className="text-sm font-semibold text-ink-950">{score.overallRecommendation}</p>
        </div>

        {/* Confidence */}
        <div className="mt-4 text-xs text-ink-800">
          <span className="font-medium">Scoring Confidence:</span> {score.confidence}%
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-ink-950">Scoring Breakdown</h3>

        {dimensions.map((dim) => (
          <div key={dim.key} className="border border-pewter-slate/30 rounded-lg overflow-hidden">
            {/* Header - Clickable */}
            <button
              onClick={() =>
                setExpandedDimension(expandedDimension === dim.key ? null : dim.key)
              }
              className="w-full p-4 flex items-start justify-between hover:bg-pewter-slate/5 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="font-semibold text-ink-950">{dim.label}</span>
                <span className="inline-block px-2 py-0.5 bg-pewter-slate/20 rounded text-xs font-medium text-ink-700">
                  {dim.weight}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${getScoreColor(dim.data.score)}`}>
                  {dim.data.score}
                </span>
                <span className="text-ink-600">
                  {expandedDimension === dim.key ? '▼' : '▶'}
                </span>
              </div>
            </button>

            {/* Progress Bar */}
            <div className="h-1 bg-pewter-slate/20">
              <div
                className={`h-full ${getProgressColor(dim.data.score)} transition-all`}
                style={{ width: `${dim.data.score}%` }}
              />
            </div>

            {/* Expanded Content */}
            {expandedDimension === dim.key && (
              <div className="p-4 border-t border-pewter-slate/20 bg-pewter-slate/5 space-y-3">
                {/* LLM Reasoning */}
                <div>
                  <p className="text-xs font-semibold text-ink-700 mb-2">LLM Reasoning:</p>
                  <p className="text-sm text-ink-900">{dim.data.reasoning}</p>
                </div>

                {/* Improvement Suggestions */}
                {dim.data.suggestions && dim.data.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-700 mb-2">How to Improve:</p>
                    <ul className="text-sm text-ink-800 space-y-1">
                      {dim.data.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-oxidised-copper">→</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scoring Guidelines */}
      <div className="bg-pewter-slate/10 border border-pewter-slate/30 rounded-lg p-4">
        <h4 className="font-semibold text-ink-950 mb-3 text-sm">Scoring Guidelines</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-signal-600"></div>
            <span>
              <strong>85-100:</strong> Queue immediately
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-oxidised-copper"></div>
            <span>
              <strong>75-85:</strong> Good, queue soon
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-600"></div>
            <span>
              <strong>65-75:</strong> Fair, needs work
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-ember-orange"></div>
            <span>
              <strong>&lt;65:</strong> Low, revise topic
            </span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="text-xs text-ink-700 bg-parchment/50 border border-pewter-slate/30 rounded-lg p-3">
        <p>
          <strong>LLM-Powered Scoring:</strong> This score is generated by Claude AI based on your strategy.
          Each dimension is intelligently evaluated with specific feedback and improvement suggestions.
        </p>
      </div>
    </div>
  );
}
