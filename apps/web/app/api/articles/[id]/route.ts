// API route: GET/PUT/DELETE /api/articles/[id] — Get, update, or delete a specific article
// Fetches from Supabase, never from memory store

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const id = params.id;

    const supabase = createServerClient();
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (error || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Convert snake_case status to UPPER_CASE for component
    const statusMap: Record<string, string> = {
      'not_started': 'NOT_STARTED',
      'queued': 'QUEUED',
      'working': 'WORKING',
      'ready_for_review': 'READY_FOR_REVIEW',
      'approved': 'APPROVED',
      'changes_requested': 'CHANGES_REQUESTED',
      'blocked': 'BLOCKED',
      'paused': 'PAUSED',
      'cancelled': 'CANCELLED',
    };

    const normalizedStatus = statusMap[article.status?.toLowerCase() || ''] || 'NOT_STARTED';

    return NextResponse.json({
      id: article.id,
      contentId: article.content_id,
      title: article.title,
      brief: article.brief,
      outline: article.outline,
      content: article.content || '',
      status: normalizedStatus,
      topicId: article.topic_id,
      strategyId: article.strategy_id,
      angle: article.angle,
      targetAudience: article.target_audience,
      briefingSessionId: article.briefing_session_id || null,
      briefingInsights: article.briefing_insights || {},
      assignedSME: article.assigned_sme,
      owner: article.owner,
      plannedPublishDate: article.planned_publish_date,
      linkedSources: article.linked_sources || [],
      seoScore: article.seo_score || null,
      seoAnalysis: article.seo_analysis || null,
      selectedCTA: article.selected_cta || null,
      generatedCTAs: article.generated_ctas || null,
      selectedImage: article.selected_image || null,
      generatedImages: article.generated_images || [],
      wordCount: article.word_count,
      pausedReason: article.paused_reason,
      blockedReason: article.blocked_reason,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve article', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await request.json();

    const supabase = createServerClient();

    // Get current article
    const { data: article, error: getError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (getError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    // Map camelCase to snake_case for Supabase
    if (body.title !== undefined) updateData.title = body.title;
    if (body.brief !== undefined) updateData.brief = body.brief;
    if (body.outline !== undefined) updateData.outline = body.outline;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.angle !== undefined) updateData.angle = body.angle;
    if (body.targetAudience !== undefined) updateData.target_audience = body.targetAudience;
    if (body.assignedSME !== undefined) updateData.assigned_sme = body.assignedSME;
    if (body.plannedPublishDate !== undefined) updateData.planned_publish_date = body.plannedPublishDate;
    if (body.linkedSources !== undefined) updateData.linked_sources = body.linkedSources;
    if (body.seoScore !== undefined) updateData.seo_score = body.seoScore;
    if (body.seoAnalysis !== undefined) updateData.seo_analysis = body.seoAnalysis;
    if (body.selectedCTA !== undefined) updateData.selected_cta = body.selectedCTA;
    if (body.generatedCTAs !== undefined) updateData.generated_ctas = body.generatedCTAs;
    if (body.selectedImage !== undefined) updateData.selected_image = body.selectedImage;
    if (body.generatedImages !== undefined) updateData.generated_images = body.generatedImages;
    if (body.pausedReason !== undefined) updateData.paused_reason = body.pausedReason;
    if (body.blockedReason !== undefined) updateData.blocked_reason = body.blockedReason;

    updateData.updated_at = new Date().toISOString();

    // Recalculate word count if content changed
    if (body.content) {
      const words = body.content.split(/\s+/).filter((w: string) => w.length > 0);
      updateData.word_count = words.length;
    }

    // Update article
    const { data: updated, error: updateError } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', workspace.workspaceId)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('[API] Article update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update article' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      contentId: updated.content_id,
      title: updated.title,
      brief: updated.brief,
      outline: updated.outline,
      content: updated.content || '',
      status: updated.status,
      topicId: updated.topic_id,
      strategyId: updated.strategy_id,
      angle: updated.angle,
      targetAudience: updated.target_audience,
      briefingSessionId: updated.briefing_session_id || null,
      briefingInsights: updated.briefing_insights || {},
      assignedSME: updated.assigned_sme,
      owner: updated.owner,
      plannedPublishDate: updated.planned_publish_date,
      linkedSources: updated.linked_sources || [],
      seoScore: updated.seo_score || null,
      seoAnalysis: updated.seo_analysis || null,
      selectedCTA: updated.selected_cta || null,
      generatedCTAs: updated.generated_ctas || null,
      selectedImage: updated.selected_image || null,
      generatedImages: updated.generated_images || [],
      wordCount: updated.word_count,
      pausedReason: updated.paused_reason,
      blockedReason: updated.blocked_reason,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    console.error('[API] Article update error:', error);
    return NextResponse.json(
      { error: 'Failed to update article', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const id = params.id;

    const supabase = createServerClient();

    // Check if article exists
    const { data: article, error: getError } = await supabase
      .from('articles')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (getError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Delete article
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspace.workspaceId);

    if (deleteError) {
      console.error('[API] Article deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete article' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Article ${id} deleted successfully`,
    });
  } catch (error) {
    console.error('[API] Article deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete article', message: (error as Error).message },
      { status: 500 }
    );
  }
}
