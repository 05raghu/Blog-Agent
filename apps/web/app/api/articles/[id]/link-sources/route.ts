// API route: POST /api/articles/[id]/link-sources — Link sources to an article
// Fetches from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function POST(
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
    const { sourceIds } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(sourceIds)) {
      return NextResponse.json(
        { error: 'sourceIds must be an array' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get article from Supabase
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Update article with linked sources
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        linked_sources: sourceIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId)
      .eq('workspace_id', workspace.workspaceId);

    if (updateError) {
      console.error('[API] Link sources error:', updateError);
      return NextResponse.json(
        { error: 'Failed to link sources' },
        { status: 400 }
      );
    }

    console.log(`[API] Linked ${sourceIds.length} source(s) to article ${articleId}`);

    return NextResponse.json({
      success: true,
      articleId,
      linkedSourcesCount: sourceIds.length,
    });
  } catch (error) {
    console.error('[API] Link sources error:', error);
    return NextResponse.json(
      { error: 'Failed to link sources', message: (error as Error).message },
      { status: 500 }
    );
  }
}
