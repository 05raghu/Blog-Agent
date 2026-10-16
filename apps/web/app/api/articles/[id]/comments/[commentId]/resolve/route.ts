// API route: PATCH /api/articles/[id]/comments/[commentId]/resolve
// Mark a comment as resolved

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
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
    const commentId = params.commentId;
    const body = await request.json();
    const { resolved } = body; // true = resolve, false = unresolve

    const supabase = createServerClient();

    // Get the comment to verify it exists
    const { data: comment, error: fetchError } = await supabase
      .from('article_comments')
      .select('*')
      .eq('id', commentId)
      .eq('article_id', articleId)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Update comment status
    const { error: updateError } = await supabase
      .from('article_comments')
      .update({
        is_resolved: resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolved ? `${workspace.userId}|${workspace.email}` : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('workspace_id', workspace.workspaceId);

    if (updateError) {
      console.error('[API] Comment update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: resolved ? 'Comment marked as resolved' : 'Comment unmarked as resolved',
    });
  } catch (error) {
    console.error('[API] Comment resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve comment', message: (error as Error).message },
      { status: 500 }
    );
  }
}
