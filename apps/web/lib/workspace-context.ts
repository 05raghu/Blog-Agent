// Workspace context - derives workspaceId from Supabase Auth user
// Maps user.id to workspace for multi-tenant isolation

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from './supabase-client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface WorkspaceUser {
  id: string;
  email: string;
  workspaceId: string;
  role: 'admin' | 'marketer' | 'founder' | 'sme';
}

// Derive workspaceId from user
// For V1: use 'default-workspace' for all users
// For V2: create workspace per user/org and store mapping in DB
export function deriveWorkspaceId(user: User | null): string {
  if (!user) return 'default-workspace';
  // TODO: Query Workspace table to get user's workspaceId
  // For now: all users share default workspace
  return 'default-workspace';
}

// Get default role for new users
function getDefaultRole(email: string): WorkspaceUser['role'] {
  // If email matches pattern, assign admin role
  if (email?.endsWith('@codewave.com')) {
    return 'marketer'; // Codewave team defaults to marketer
  }
  return 'marketer'; // Default role
}

export function useWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const supabase = createClient();

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);

        if (!session) {
          // Only redirect if we're not already on auth page
          const isAuthPage = window.location.pathname.startsWith('/auth');
          if (!isAuthPage) {
            console.log('[Auth] No session, redirecting to login');
            router.push('/auth/login');
          } else {
            console.log('[Auth] On auth page, no redirect needed');
          }
        } else {
          console.log('[Auth] Session found for', session.user.email);
        }
        setLoading(false);
      }).catch((err) => {
        console.log('[Auth] Supabase not configured, using demo mode', err.message);
        setLoading(false);
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(
        (_event: AuthChangeEvent, session: Session | null) => {
          setUser(session?.user ?? null);
          console.log('[Auth] Auth state changed:', _event, session?.user?.email);
        }
      );
    } catch (err) {
      console.log('[Auth] Supabase initialization failed, using demo mode');
      setLoading(false);
    }
  }, [router]);

  const workspaceId = deriveWorkspaceId(user);
  const role = getDefaultRole(user?.email || '');

  return {
    user,
    workspaceId,
    userId: user?.id,
    userEmail: user?.email,
    role,
    loading,
    isAuthenticated: !!user,
  };
}

export function getWorkspaceId(): string {
  // Server-side use only - requires auth context
  // For server components, pass workspaceId explicitly
  return 'default-workspace';
}
