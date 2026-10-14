// API route: POST/GET /api/strategy — Manage editorial strategy
// Fetches from database, never from memory store

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

    const supabase = createServerClient();
    const { data: strategies, error } = await supabase
      .from('strategy_versions')
      .select('*')
      .eq('workspace_id', workspace.workspaceId);

    if (error) {
      console.error('[API] Strategy fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch strategies' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workspaceId: workspace.workspaceId,
      strategies: strategies || [],
    });
  } catch (error) {
    console.error('[API] Strategy fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies', message: (error as Error).message },
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
    const { title, offerings, targetIcps, icps, geographies, competitors, contentMix, description } = body;

    if (!offerings || !Array.isArray(offerings)) {
      return NextResponse.json(
        { error: 'offerings is required and must be an array' },
        { status: 400 }
      );
    }

    const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const supabase = createServerClient();
    const { error: insertError } = await supabase
      .from('strategy_versions')
      .insert({
        id: strategyId,
        workspace_id: workspace.workspaceId,
        version: 1,
        title: title || 'Default Strategy',
        description: description || '',
        offerings,
        icps: icps || targetIcps || [],
        geographies: geographies || [],
        competitors: competitors || [],
        content_mix: contentMix || {},
        quality_thresholds: {},
        source_policy: {},
        approval_policy: {},
        sme_policies: {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API] Strategy insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create strategy' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: strategyId,
      title: title || 'Default Strategy',
      offerings,
      targetIcps: icps || targetIcps || [],
      geographies: geographies || [],
      competitors: competitors || [],
      contentMix: contentMix || {},
      description,
    });
  } catch (error) {
    console.error('[API] Strategy creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create strategy', message: (error as Error).message },
      { status: 500 }
    );
  }
}
