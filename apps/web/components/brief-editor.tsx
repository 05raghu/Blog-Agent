'use client';

import { useState } from 'react';

interface BriefEditorProps {
  title: string;
  brief: string;
  angle?: string;
  targetAudience?: string;
  onBriefChange: (brief: string) => void;
  onAngleChange: (angle: string) => void;
  onAudienceChange: (audience: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function BriefEditor({
  title,
  brief,
  angle = '',
  targetAudience = '',
  onBriefChange,
  onAngleChange,
  onAudienceChange,
  onSave,
  isSaving = false,
}: BriefEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">Article Brief & Angle</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary text-sm"
          >
            ✎ Edit Brief
          </button>
        )}
      </div>

      {isEditing ? (
        // Edit Mode
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Brief (Core message)
            </label>
            <textarea
              value={brief}
              onChange={(e) => onBriefChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded text-sm h-24"
              placeholder="What is the core message of this article?"
            />
            <p className="text-xs text-slate-500 mt-1">{brief.length} characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Angle (Unique perspective)
            </label>
            <input
              type="text"
              value={angle}
              onChange={(e) => onAngleChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded text-sm"
              placeholder="e.g., 'How AI is changing customer support in 2024'"
            />
            <p className="text-xs text-slate-500 mt-1">Optional - Sets the unique angle</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => onAudienceChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded text-sm"
              placeholder="e.g., 'SaaS startup founders'"
            />
            <p className="text-xs text-slate-500 mt-1">Optional - Who should read this?</p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave();
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                '✓ Save Brief'
              )}
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-blue-900 uppercase mb-2">Brief</p>
            <p className="text-slate-900 leading-relaxed">{brief || 'No brief set'}</p>
          </div>

          {angle && (
            <div>
              <p className="text-xs font-semibold text-blue-900 uppercase mb-1">Angle</p>
              <p className="text-slate-700">{angle}</p>
            </div>
          )}

          {targetAudience && (
            <div>
              <p className="text-xs font-semibold text-blue-900 uppercase mb-1">Target Audience</p>
              <p className="text-slate-700">{targetAudience}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
