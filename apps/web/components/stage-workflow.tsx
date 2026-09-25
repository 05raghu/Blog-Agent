'use client';

import { STAGE_COLORS, STAGE_LABELS } from '@blog-agent/domain';

interface StageWorkflowProps {
  currentStage: string;
  onStageChange: (stage: string) => void;
  canTransition: (to: string) => boolean;
}

const stages = ['NOT_STARTED', 'QUEUED', 'WORKING', 'READY_FOR_REVIEW', 'APPROVED', 'BLOCKED', 'CANCELLED'];

export function StageWorkflow({ currentStage, onStageChange, canTransition }: StageWorkflowProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="font-bold text-slate-900 mb-6">Workflow Status</h3>

      {/* Stage Rail */}
      <div className="space-y-4">
        {stages.map((stage, idx) => {
          const isActive = currentStage === stage;
          const isPassed = stages.indexOf(stage) < stages.indexOf(currentStage);
          const canMove = canTransition(stage);
          const stageColor = STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || '#9CA3AF';

          return (
            <div key={stage} className="flex items-center gap-4">
              {/* Stage Indicator */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white cursor-pointer transition-all ${
                  isActive ? 'ring-4 ring-offset-2' : ''
                }`}
                style={{
                  backgroundColor: stageColor,
                  opacity: isPassed || isActive ? 1 : 0.5,
                  ringColor: stageColor,
                }}
                onClick={() => canMove && onStageChange(stage)}
              >
                {isPassed ? '✓' : idx + 1}
              </div>

              {/* Stage Info */}
              <div className="flex-1">
                <p className={`font-medium ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                  {STAGE_LABELS[stage as keyof typeof STAGE_LABELS] || stage}
                </p>
                <p className="text-xs text-slate-500">
                  {isActive && '◀ Current stage'}
                  {isPassed && '✓ Completed'}
                  {!isPassed && !isActive && '○ Pending'}
                </p>
              </div>

              {/* Action Button */}
              {!isPassed && !isActive && canMove && (
                <button
                  onClick={() => onStageChange(stage)}
                  className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded transition-all"
                >
                  Move to
                </button>
              )}

              {!canMove && !isPassed && !isActive && (
                <div className="px-3 py-1 text-xs text-slate-500">Blocked</div>
              )}

              {/* Connector Line */}
              {idx < stages.length - 1 && (
                <div
                  className="absolute left-6 w-1 h-8 -ml-1 mt-12"
                  style={{
                    backgroundColor: isPassed ? STAGE_COLORS[stage as keyof typeof STAGE_COLORS] : '#e2e8f0',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-400" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-300" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}
