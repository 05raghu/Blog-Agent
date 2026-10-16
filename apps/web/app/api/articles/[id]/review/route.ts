// API route: PATCH /api/articles/[id]/review
// Handle article review workflow: submit, approve, request changes

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function PATCH(
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
    const body = await request.json();
    const { action, feedback } = body; // action: 'submit', 'approve', 'request-changes'

    if (!action || !['submit', 'approve', 'request-changes'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action required: submit, approve, or request-changes' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get current article
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    let newStatus = article.status;
    let changeType = '';

    switch (action) {
      case 'submit':
        newStatus = 'ready_for_review';
        changeType = 'submitted_review';
        break;
      case 'approve':
        newStatus = 'approved';
        changeType = 'approved';
        break;
      case 'request-changes':
        newStatus = 'changes_requested';
        changeType = 'rejected';
        break;
    }

    // Update article status
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId)
      .eq('workspace_id', workspace.workspaceId);

    if (updateError) {
      console.error('[API] Article update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 400 }
      );
    }

    // Create revision history entry
    const revisionId = `revision_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store email along with user ID for easier display
    const userEmail = workspace.email || workspace.userId;

    const { error: revisionError } = await supabase
      .from('revision_history')
      .insert({
        id: revisionId,
        article_id: articleId,
        workspace_id: workspace.workspaceId,
        revision_number: 1, // TODO: increment based on actual revisions
        previous_status: article.status,
        new_status: newStatus,
        changed_by: `${workspace.userId}|${userEmail}`, // Store both ID and email
        change_type: changeType,
        description: feedback || `Article ${action}ed`,
      });

    if (revisionError) {
      console.warn('[API] Revision history error:', revisionError);
      // Don't fail the request, just warn
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Article ${action}ed successfully`,
    });
  } catch (error) {
    console.error('[API] Review action error:', error);
    return NextResponse.json(
      { error: 'Failed to process review action', message: (error as Error).message },
      { status: 500 }
    );
  }
}
