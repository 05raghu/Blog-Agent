// Debug endpoint to check article statuses
import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get all articles in this workspace
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, status, created_at')
      .eq('workspace_id', workspace.workspaceId)
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workspace: {
        id: workspace.workspaceId,
        userId: workspace.userId,
        userRole: workspace.role,
      },
      articles: articles?.map(a => ({
        id: a.id,
        title: a.title,
        status: a.status,
        createdAt: a.created_at,
      })) || [],
      info: {
        totalArticles: articles?.length || 0,
        message: 'Check the "status" field for each article. Valid statuses: NOT_STARTED, QUEUED, WORKING, READY_FOR_REVIEW, APPROVED, CHANGES_REQUESTED, BLOCKED, PAUSED, CANCELLED'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
