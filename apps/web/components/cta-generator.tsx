'use client';

import { useState, useEffect } from 'react';

interface CTA {
  text: string;
  rationale: string;
}

interface CTAGeneratorProps {
  title: string;
  content: string;
  brief: string;
  targetAudience?: string;
  onGenerate: () => Promise<void>;
  onSelect?: (cta: CTA | null) => Promise<void>;
  isLoading?: boolean;
  ctas?: CTA[];
  selectedCTA?: CTA | null;
}

export function CTAGenerator({
  title,
  content,
  brief,
  targetAudience,
  onGenerate,
  onSelect,
  isLoading = false,
  ctas = [],
  selectedCTA: selectedCtaFromProps = null,
}: CTAGeneratorProps) {
  const [showCTAs, setShowCTAs] = useState(ctas.length > 0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    if (!selectedCtaFromProps || ctas.length === 0) return null;
    const idx = ctas.findIndex(c => c.text === selectedCtaFromProps.text);
    return idx >= 0 ? idx : null;
  });

  useEffect(() => {
    if (ctas.length > 0) {
      setShowCTAs(true);
    }
  }, [ctas]);

  useEffect(() => {
    if (selectedCtaFromProps && ctas.length > 0) {
      const idx = ctas.findIndex(c => c.text === selectedCtaFromProps.text);
      setSelectedIndex(idx >= 0 ? idx : null);
    }
  }, [selectedCtaFromProps, ctas]);

  const handleGenerate = async () => {
    setShowCTAs(true);
    await onGenerate();
  };

  const handleSelectCTA = async (idx: number) => {
    const isCurrentlySelected = selectedIndex === idx;
    const newIndex = isCurrentlySelected ? null : idx;
    setSelectedIndex(newIndex);

    if (onSelect) {
      const selectedCta = newIndex !== null ? ctas[newIndex] : null;
      await onSelect(selectedCta);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      {ctas.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-slate-600 mb-4">
            Generate action-oriented CTAs that drive reader engagement and conversion
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !content || !title}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              '📣 Generate CTA'
            )}
          </button>
        </div>
      )}

      {/* CTAs Display */}
      {showCTAs && ctas.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Suggested Call-to-Actions</h3>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              🔄 Regenerate
            </button>
          </div>

          <div className="space-y-3">
            {ctas.map((cta, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedIndex === idx
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => handleSelectCTA(idx)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIndex === idx}
                    onChange={() => handleSelectCTA(idx)}
                    className="mt-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{cta.text}</p>
                    <p className="text-xs text-slate-600 mt-2 italic">{cta.rationale}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selection Summary */}
          {selectedIndex !== null && selectedIndex >= 0 && ctas[selectedIndex] && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800">
                ✓ CTA Selected: "{ctas[selectedIndex].text}"
              </p>
              <p className="text-xs text-green-700 mt-1">
                This CTA will be included in your final article package
              </p>
            </div>
          )}
        </div>
      )}

      {!isLoading && ctas.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <p className="text-slate-600">
            Click "Generate CTA" to create actionable calls-to-action that drive reader engagement
          </p>
        </div>
      )}
    </div>
  );
}
