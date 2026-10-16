// API route: PATCH /api/articles/update-briefing-insights
// Updates an article with extracted briefing session insights

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function PATCH(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const { articleId, briefingSessionId, briefingInsights } = await request.json();

    if (!articleId || !briefingSessionId || !briefingInsights) {
      return NextResponse.json(
        { error: 'articleId, briefingSessionId, and briefingInsights are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Update article with briefing insights
    const { data: updated, error } = await supabase
      .from('articles')
      .update({
        briefing_session_id: briefingSessionId,
        briefing_insights: briefingInsights,
      })
      .eq('id', articleId)
      .eq('workspace_id', workspace.workspaceId)
      .select()
      .single();

    if (error || !updated) {
      console.error('[API] Briefing insights update error:', error);
      return NextResponse.json(
        { error: 'Failed to update article with briefing insights' },
        { status: 400 }
      );
    }

    console.log(`[API] Updated article ${articleId} with briefing insights from session ${briefingSessionId}`);

    return NextResponse.json({
      success: true,
      message: 'Article updated with briefing session insights',
      article: updated,
    });
  } catch (error) {
    console.error('[API] Briefing insights update error:', error);
    return NextResponse.json(
      { error: 'Failed to update article', message: (error as Error).message },
      { status: 500 }
    );
  }
}
