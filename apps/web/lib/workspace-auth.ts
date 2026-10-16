// Server-side workspace detection from Supabase Auth
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Create server-side Supabase client with service key (for querying memberships)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: 'admin' | 'marketer' | 'founder' | 'sme';
  email: string;
}

/**
 * Decode JWT payload without verification (for reading claims)
 * Handles both custom JWT and Supabase Auth JWT formats
 */
function decodeJWT(token: string): Record<string, any> | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[JWT Decode] Error:', error);
    return null;
  }
}

/**
 * Extract workspace context from request's Authorization header
 * Returns userId, workspaceId, and role from the authenticated user's membership
 */
export async function getWorkspaceContext(request: NextRequest): Promise<WorkspaceContext | null> {
  try {
    let token: string | null = null;

    // First, try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    }

    // If no Authorization header, try to get from cookies
    if (!token) {
      token = request.cookies.get('authToken')?.value || null;
    }

    if (!token) {
      console.warn('[Workspace Auth] No token found in Authorization header or cookies');
      return null;
    }

    // Decode JWT payload (without signature verification for now)
    const payload = decodeJWT(token);
    if (!payload) {
      console.warn('[Workspace Auth] Invalid JWT token');
      return null;
    }

    // Handle both custom JWT format (userId, workspaceId) and Supabase JWT format (sub)
    const userId = payload.userId || payload.sub;
    const email = payload.email;
    const workspaceId = payload.workspaceId;

    if (!userId) {
      console.warn('[Workspace Auth] No user ID in JWT');
      return null;
    }

    // If workspaceId is already in the token, use it
    if (workspaceId) {
      return {
        userId,
        workspaceId,
        role: (payload.role || 'marketer') as WorkspaceContext['role'],
        email: email || 'unknown@example.com',
      };
    }

    // Otherwise, query memberships table to get user's workspace and role
    const supabase = createServerClient();
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('workspace_id, role')
      .eq('user_id', userId)
      .single(); // Assume one primary workspace per user for now

    if (error || !membership) {
      console.warn('[Workspace Auth] No membership found for user:', userId, error?.message);
      // Fallback: create a default workspace for this user if none exists
      return {
        userId,
        workspaceId: `workspace_${userId}`, // Generate workspace from user ID
        role: 'marketer', // Default role
        email: email || 'unknown@example.com',
      };
    }

    return {
      userId,
      workspaceId: membership.workspace_id,
      role: membership.role as WorkspaceContext['role'],
      email: email || 'unknown@example.com',
    };
  } catch (error) {
    console.error('[Workspace Auth] Error extracting workspace context:', error);
    return null;
  }
}

