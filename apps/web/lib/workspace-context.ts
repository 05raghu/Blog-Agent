// Workspace context - provides workspaceId based on user/auth
// For now: hardcoded to 'default-workspace'
// TODO: Derive from Supabase Auth user context

import { useCallback } from 'react';

export interface WorkspaceUser {
  id: string;
  email: string;
  workspaceId: string;
  role: 'admin' | 'marketer' | 'founder' | 'sme';
}

// For now, mock user - in future will come from Supabase Auth
const MOCK_USER: WorkspaceUser = {
  id: 'user_default',
  email: 'user@codewave.com',
  workspaceId: 'default-workspace',
  role: 'marketer',
};

export function useWorkspace() {
  // In future: fetch from Supabase Auth context
  const user = MOCK_USER;

  return {
    workspaceId: user.workspaceId,
    userId: user.id,
    userEmail: user.email,
    role: user.role,
  };
}

export function getWorkspaceId(): string {
  // Server-side: extract from request context
  // For now: return default
  return MOCK_USER.workspaceId;
}
