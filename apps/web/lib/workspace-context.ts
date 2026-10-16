// Workspace context - derives workspaceId from custom JWT token
// Maps user.id to workspace for multi-tenant isolation

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface WorkspaceUser {
  id: string;
  email: string;
  workspaceId: string;
  role: 'admin' | 'marketer' | 'founder' | 'sme';
}

interface JWTPayload {
  userId: string;
  email: string;
  workspaceId: string;
  role?: string;
}

// Decode JWT token from localStorage
function decodeJWTToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));

    return decoded as JWTPayload;
  } catch (error) {
    console.error('[JWT Decode] Error:', error);
    return null;
  }
}

export function useWorkspace() {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      // Check for JWT token in localStorage (custom auth)
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      if (token) {
        const decoded = decodeJWTToken(token);
        if (decoded) {
          // Successfully decoded JWT token
          setUser({
            id: decoded.userId,
            email: decoded.email,
            workspaceId: decoded.workspaceId || 'default-workspace',
            role: (decoded.role || 'marketer') as WorkspaceUser['role'],
          });
          console.log('[Auth] JWT token found for', decoded.email);
          setLoading(false);
          return;
        }
      }

      // No valid token found
      setUser(null);
      const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
      if (!isAuthPage) {
        console.log('[Auth] No token, redirecting to login');
        router.push('/auth/login');
      }
      setLoading(false);
    } catch (err) {
      console.error('[Auth] Error checking authentication:', err);
      setUser(null);
      setLoading(false);
    }
  }, [router]);

  return {
    user,
    workspaceId: user?.workspaceId || 'default-workspace',
    userId: user?.id,
    userEmail: user?.email,
    role: user?.role || 'marketer',
    loading,
    isAuthenticated: !!user,
  };
}

export function getWorkspaceId(): string {
  if (typeof window === 'undefined') return 'default-workspace';

  const token = localStorage.getItem('authToken');
  if (token) {
    const decoded = decodeJWTToken(token);
    if (decoded?.workspaceId) {
      return decoded.workspaceId;
    }
  }
  return 'default-workspace';
}
