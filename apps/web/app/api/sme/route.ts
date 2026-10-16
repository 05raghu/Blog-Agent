// API route: GET/POST/PUT/DELETE /api/sme
// Manages SME profiles at workspace-level
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
    const { data: smes, error } = await supabase
      .from('sme_profiles')
      .select('*')
      .eq('workspace_id', workspace.workspaceId);

    if (error) {
      console.error('[API] SME fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SMEs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workspaceId: workspace.workspaceId,
      smes: smes || [],
    });
  } catch (error) {
    console.error('[API] SME fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SME profiles', message: (error as Error).message },
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
    const { sme } = body;

    if (!sme?.name || !sme?.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const smeId = sme.id || `sme_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const supabase = createServerClient();
    const { error: insertError } = await supabase
      .from('sme_profiles')
      .insert({
        id: smeId,
        workspace_id: workspace.workspaceId,
        user_id: workspace.userId,
        name: sme.name,
        email: sme.email,
        expertise: sme.expertise || [],
        biography: sme.biography,
        preferred_topics: sme.preferredTopics || [],
        capacity_hours_per_month: sme.capacityHoursPerMonth || 3,
        attribution_rules: sme.attributionRules || {},
        past_contributions: sme.pastContributions || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API] SME insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create SME' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sme: { id: smeId, ...sme, workspaceId: workspace.workspaceId },
    });
  } catch (error) {
    console.error('[API] SME creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create SME profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { smeId, sme } = body;

    if (!smeId) {
      return NextResponse.json({ error: 'SME ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error: updateError, data } = await supabase
      .from('sme_profiles')
      .update({
        name: sme?.name,
        email: sme?.email,
        expertise: sme?.expertise,
        biography: sme?.biography,
        preferred_topics: sme?.preferredTopics,
        capacity_hours_per_month: sme?.capacityHoursPerMonth,
        attribution_rules: sme?.attributionRules,
        past_contributions: sme?.pastContributions,
      })
      .eq('id', smeId)
      .eq('workspace_id', workspace.workspaceId)
      .select()
      .single();

    if (updateError || !data) {
      console.error('[API] SME update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update SME' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sme: { ...data, ...sme, workspaceId: workspace.workspaceId },
    });
  } catch (error) {
    console.error('[API] SME update error:', error);
    return NextResponse.json(
      { error: 'Failed to update SME profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const smeId = searchParams.get('smeId');

    if (!smeId) {
      return NextResponse.json({ error: 'SME ID is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error: deleteError } = await supabase
      .from('sme_profiles')
      .delete()
      .eq('id', smeId)
      .eq('workspace_id', workspace.workspaceId);

    if (deleteError) {
      console.error('[API] SME delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete SME' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SME profile deleted',
    });
  } catch (error) {
    console.error('[API] SME deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete SME profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}
