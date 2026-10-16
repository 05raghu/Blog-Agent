// API route: GET/POST /api/knowledge/claims — Manage claims

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');
    const sourceId = searchParams.get('sourceId');

    if (!articleId && !sourceId) {
      return NextResponse.json({ error: 'articleId or sourceId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    let query = supabase.from('claims').select('*').eq('workspace_id', workspace.workspaceId);

    if (articleId) {
      query = query.eq('article_id', articleId);
    } else if (sourceId) {
      query = query.eq('source_id', sourceId);
    }

    const { data: claims, error } = await query;

    if (error) {
      console.error('[API] Claims fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch claims' },
        { status: 500 }
      );
    }

    return NextResponse.json({ claims: claims || [] });
  } catch (error) {
    console.error('[API] Claims fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { articleId, sourceId, text, type = 'factual' } = body;

    if (!articleId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: articleId, text' },
        { status: 400 }
      );
    }

    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const supabase = createServerClient();
    const { error: insertError } = await supabase
      .from('claims')
      .insert({
        id: claimId,
        workspace_id: workspace.workspaceId,
        article_id: articleId,
        source_id: sourceId || null,
        text,
        type,
        status: 'unverified',
        flagged_for_review: false,
      });

    if (insertError) {
      console.error('[API] Claim insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create claim' },
        { status: 400 }
      );
    }

    console.log(`[API] Created claim ${claimId} for article ${articleId}`);

    return NextResponse.json({
      success: true,
      id: claimId,
      text,
      type,
      status: 'unverified',
      sourceId,
    });
  } catch (error) {
    console.error('[API] Claim creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create claim', message: (error as Error).message },
      { status: 500 }
    );
  }
}
