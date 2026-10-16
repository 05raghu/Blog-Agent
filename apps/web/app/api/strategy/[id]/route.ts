// API route: GET/PUT/DELETE /api/strategy/[id]

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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    const { data: strategy, error } = await supabase
      .from('strategy_versions')
      .select('*')
      .eq('id', params.id)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (error || !strategy) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(strategy);
  } catch (err) {
    console.error('[API] Strategy fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch strategy' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { offerings, icps, geographies, competitors, contentMix, title, description } = body;

    const supabase = createServerClient();

    // Check if strategy exists
    const { data: existing, error: fetchError } = await supabase
      .from('strategy_versions')
      .select('*')
      .eq('id', params.id)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (fetchError || !existing) {
      console.error('[API] Strategy fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    // Update strategy
    const { data: updated, error: updateError } = await supabase
      .from('strategy_versions')
      .update({
        ...(title && { title }),
        ...(description && { description }),
        offerings: offerings || existing.offerings,
        icps: icps || existing.icps,
        geographies: geographies || existing.geographies,
        competitors: competitors || existing.competitors,
        content_mix: contentMix || existing.content_mix,
      })
      .eq('id', params.id)
      .eq('workspace_id', workspace.workspaceId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Strategy update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update strategy', details: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      strategy: updated,
      message: 'Strategy updated successfully',
    });
  } catch (err) {
    console.error('[API] Strategy update error:', err);
    return NextResponse.json(
      { error: 'Failed to update strategy' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Check if strategy exists
    const { data: existing } = await supabase
      .from('strategy_versions')
      .select('*')
      .eq('id', params.id)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    // Delete associated topics first
    await supabase
      .from('topic_candidates')
      .delete()
      .eq('strategy_id', params.id)
      .eq('workspace_id', workspace.workspaceId);

    // Delete strategy
    const { error: deleteError } = await supabase
      .from('strategy_versions')
      .delete()
      .eq('id', params.id)
      .eq('workspace_id', workspace.workspaceId);

    if (deleteError) {
      console.error('[API] Strategy delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete strategy' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Strategy deleted successfully',
    });
  } catch (err) {
    console.error('[API] Strategy delete error:', err);
    return NextResponse.json(
      { error: 'Failed to delete strategy' },
      { status: 500 }
    );
  }
}
