// Article workflow state machine — defines valid stage transitions

export type ArticleStage =
  | 'NOT_STARTED'
  | 'QUEUED'
  | 'WORKING'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'BLOCKED'
  | 'PAUSED'
  | 'CANCELLED';

export interface ArticleState {
  stage: ArticleStage;
  timestamp: Date;
  actor?: string; // user ID who triggered transition
  reason?: string; // why paused/blocked/rejected
}

// Valid transitions from each stage
const TRANSITIONS: Record<ArticleStage, ArticleStage[]> = {
  NOT_STARTED: ['QUEUED', 'CANCELLED'],
  QUEUED: ['WORKING', 'PAUSED', 'CANCELLED'],
  WORKING: ['READY_FOR_REVIEW', 'PAUSED', 'BLOCKED', 'CANCELLED'],
  READY_FOR_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'BLOCKED'],
  APPROVED: ['BLOCKED'],
  CHANGES_REQUESTED: ['WORKING', 'CANCELLED'],
  BLOCKED: ['APPROVED', 'WORKING', 'CANCELLED'],
  PAUSED: ['READY_FOR_REVIEW', 'WORKING', 'CANCELLED'],
  CANCELLED: [], // terminal state
};

export function canTransition(from: ArticleStage, to: ArticleStage): boolean {
  const validNext = TRANSITIONS[from];
  return validNext && validNext.includes(to);
}

export function validateTransition(from: ArticleStage, to: ArticleStage): {
  valid: boolean;
  error?: string;
} {
  if (!canTransition(from, to)) {
    const validTransitions = TRANSITIONS[from];
    return {
      valid: false,
      error: `Cannot transition from ${from} to ${to}. Valid transitions: ${validTransitions ? validTransitions.join(', ') : 'none'}`,
    };
  }
  return { valid: true };
}

// Workflow metadata
export const STAGE_LABELS: Record<ArticleStage, string> = {
  NOT_STARTED: 'Not Started',
  QUEUED: 'Queued',
  WORKING: 'Generating',
  READY_FOR_REVIEW: 'Ready for Review',
  APPROVED: 'Approved',
  CHANGES_REQUESTED: 'Changes Requested',
  BLOCKED: 'Blocked',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

export const STAGE_COLORS: Record<ArticleStage, string> = {
  NOT_STARTED: '#9CA3AF', // gray
  QUEUED: '#93C5FD', // light blue
  WORKING: '#FCD34D', // yellow
  READY_FOR_REVIEW: '#A8DDE8', // signal cyan
  APPROVED: '#86EFAC', // green
  CHANGES_REQUESTED: '#FB7185', // red
  BLOCKED: '#F87171', // dark red
  PAUSED: '#D97706', // orange
  CANCELLED: '#6B7280', // dark gray
};

export function isTerminalStage(stage: ArticleStage): boolean {
  return stage === 'APPROVED' || stage === 'CANCELLED';
}

export function isBlockingStage(stage: ArticleStage): boolean {
  return stage === 'BLOCKED' || stage === 'PAUSED';
}
