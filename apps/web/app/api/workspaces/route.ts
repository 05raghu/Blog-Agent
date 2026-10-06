// API route: POST /api/workspaces — Create workspace
// Creates workspace and membership for authenticated user

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/workspace-auth';

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    // Decode JWT to get user info
    const token = authHeader.slice(7);
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    const userId = payload.sub;

    if (!userId) {
      return NextResponse.json({ error: 'No user ID in token' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceName, workspaceSlug } = body;

    if (!workspaceName || !workspaceSlug) {
      return NextResponse.json(
        { error: 'Workspace name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(workspaceSlug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      );
    }

    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const supabase = createServerClient();

    // Create workspace
    const { error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        id: workspaceId,
        name: workspaceName,
        slug: workspaceSlug,
        description: `${workspaceName} workspace`,
        config: {},
      })
      .select()
      .single();

    if (workspaceError) {
      console.error('[API] Workspace creation error:', workspaceError);
      return NextResponse.json(
        { error: 'Failed to create workspace', details: workspaceError.message },
        { status: 400 }
      );
    }

    // Create membership linking user to workspace
    const { error: membershipError } = await supabase
      .from('memberships')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: 'admin', // Creator is admin
      })
      .select()
      .single();

    if (membershipError) {
      console.error('[API] Membership creation error:', membershipError);
      return NextResponse.json(
        { error: 'Failed to create membership', details: membershipError.message },
        { status: 400 }
      );
    }

    console.log(`[API] Created workspace ${workspaceId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspaceId,
        name: workspaceName,
        slug: workspaceSlug,
      },
      message: 'Workspace created successfully',
    });
  } catch (error) {
    console.error('[API] Workspace creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace', message: (error as Error).message },
      { status: 500 }
    );
  }
}
