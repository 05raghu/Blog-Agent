// API route: GET /api/articles/[id]/revisions
// Fetch revision history for an article

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const articleId = params.id;

    const supabase = createServerClient();
    const { data: revisions, error } = await supabase
      .from('revision_history')
      .select('*')
      .eq('article_id', articleId)
      .eq('workspace_id', workspace.workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[API] Revisions fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch revisions' },
        { status: 500 }
      );
    }

    // Enrich revisions with user emails
    const enrichedRevisions = await Promise.all((revisions || []).map(async (r: any) => {
      let displayChangedBy = r.changed_by;

      // If changed_by doesn't have pipe separator (old format), fetch from users table
      if (r.changed_by && !r.changed_by.includes('|')) {
        try {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('id', r.changed_by)
            .single();

          if (user?.email && !userError) {
            displayChangedBy = `${r.changed_by}|${user.email}`;
          }
        } catch (err) {
          // If user not found, keep the original user ID
          console.warn(`[API] User not found for ID: ${r.changed_by}`);
        }
      }

      return {
        ...r,
        changed_by: displayChangedBy,
      };
    }));

    return NextResponse.json({
      success: true,
      revisions: enrichedRevisions,
    });
  } catch (error) {
    console.error('[API] Revisions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revisions', message: (error as Error).message },
      { status: 500 }
    );
  }
}
