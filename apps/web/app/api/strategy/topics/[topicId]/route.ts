// API route: GET/PUT/DELETE /api/strategy/topics/[topicId] — Get, update, or delete a topic

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const { topicId } = params;

    const supabase = createServerClient();
    const { data: topic, error } = await supabase
      .from('topic_candidates')
      .select('*')
      .eq('id', topicId)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (error || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: topic.id,
      title: topic.title,
      summary: topic.summary,
      angle: topic.angle,
      format: topic.format,
      geography: topic.geography,
      audience: topic.audience,
      targetOffering: topic.target_offering,
      score: topic.score,
      confidence: topic.confidence,
      breakdown: topic.breakdown,
      cannibalizationRisk: topic.cannibalization_risk,
      recommendedSmes: topic.recommended_smes,
      missingInputs: topic.missing_inputs,
    });
  } catch (error) {
    console.error('[API] Topic fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const { topicId } = params;
    const body = await request.json();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.angle !== undefined) updateData.angle = body.angle;
    if (body.format !== undefined) updateData.format = body.format;
    if (body.geography !== undefined) updateData.geography = body.geography;
    if (body.audience !== undefined) updateData.audience = body.audience;
    if (body.targetOffering !== undefined) updateData.target_offering = body.targetOffering;

    const supabase = createServerClient();
    const { data: updated, error } = await supabase
      .from('topic_candidates')
      .update(updateData)
      .eq('id', topicId)
      .eq('workspace_id', workspace.workspaceId)
      .select()
      .single();

    if (error || !updated) {
      console.error('[API] Topic update error:', error);
      return NextResponse.json({ error: 'Failed to update topic' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      topic: updated,
    });
  } catch (error) {
    console.error('[API] Topic update error:', error);
    return NextResponse.json(
      { error: 'Failed to update topic', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const { topicId } = params;

    const supabase = createServerClient();
    const { error } = await supabase
      .from('topic_candidates')
      .delete()
      .eq('id', topicId)
      .eq('workspace_id', workspace.workspaceId);

    if (error) {
      console.error('[API] Topic deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete topic' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Topic ${topicId} deleted successfully`,
    });
  } catch (error) {
    console.error('[API] Topic deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic', message: (error as Error).message },
      { status: 500 }
    );
  }
}
