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
 * In production, you'd verify the signature against Supabase public key
 */
function decodeJWT(token: string): Record<string, any> | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[Workspace Auth] No Bearer token in request');
      return null;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Decode JWT payload (without signature verification for now)
    const payload = decodeJWT(token);
    if (!payload) {
      console.warn('[Workspace Auth] Invalid JWT token');
      return null;
    }

    const userId = payload.sub; // 'sub' is the user ID in Supabase JWT
    const email = payload.email;

    if (!userId) {
      console.warn('[Workspace Auth] No user ID in JWT');
      return null;
    }

    // Query memberships table to get user's workspace and role
    const supabase = createServerClient();
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('workspace_id, role')
      .eq('user_id', userId)
      .single(); // Assume one primary workspace per user for now

    if (error || !membership) {
      console.warn('[Workspace Auth] No membership found for user:', userId, error?.message);
      // Fallback: create a default workspace for this user if none exists
      // Or return a demo workspace - implementation depends on policy
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
      role: membership.role,
      email: email || 'unknown@example.com',
    };
  } catch (error) {
    console.error('[Workspace Auth] Error extracting workspace context:', error);
    return null;
  }
}

