// API route: PUT /api/strategy/topics/edit — Edit and recalculate topic score

import { NextRequest, NextResponse } from 'next/server';
import { scoreTopicCandidate } from '@blog-agent/domain';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

interface EditTopicInput {
  topicId: string;
  strategyId: string;
  strategy: any;
  topic: {
    title: string;
    summary?: string;
    angle?: string;
    targetOffering?: string;
    format?: string;
    geography?: string;
    audience?: string;
  };
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
    const { topicId, strategyId, strategy, topic } = body as EditTopicInput;

    if (!topicId || !strategyId || !strategy) {
      return NextResponse.json(
        { error: 'topicId, strategyId, and strategy are required' },
        { status: 400 }
      );
    }

    if (!topic.title || topic.title.trim() === '') {
      return NextResponse.json(
        { error: 'Topic title is required' },
        { status: 400 }
      );
    }

    // Normalize strategy: API returns 'icps' but scoring expects 'targetIcps'
    const normalizedStrategy = {
      offerings: strategy.offerings || [],
      targetIcps: strategy.targetIcps || strategy.icps || [],
      geographies: strategy.geographies || [],
      competitors: strategy.competitors || [],
      contentMix: strategy.contentMix || {},
    };

    // Recalculate score with new data
    const scoreResult = scoreTopicCandidate(topic, normalizedStrategy);

    const supabase = createServerClient();
    const { data: updated, error } = await supabase
      .from('topic_candidates')
      .update({
        title: topic.title,
        summary: topic.summary || '',
        angle: topic.angle,
        target_offering: topic.targetOffering,
        geography: topic.geography,
        audience: topic.audience,
        format: topic.format || 'blog',
        score: scoreResult.score,
        confidence: scoreResult.confidence,
        breakdown: scoreResult.breakdown,
        cannibalization_risk: scoreResult.cannibalizationRisk,
        recommended_smes: scoreResult.recommendedSmes,
        missing_inputs: scoreResult.missingInputs,
      })
      .eq('id', topicId)
      .eq('workspace_id', workspace.workspaceId)
      .select()
      .single();

    if (error || !updated) {
      console.error('[API] Topic edit error:', error);
      return NextResponse.json(
        { error: 'Failed to edit topic' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      topic: {
        id: updated.id,
        title: updated.title,
        summary: updated.summary,
        angle: updated.angle,
        targetOffering: updated.target_offering,
        format: updated.format,
        geography: updated.geography,
        audience: updated.audience,
        score: updated.score,
        confidence: updated.confidence,
        breakdown: updated.breakdown,
        cannibalizationRisk: updated.cannibalization_risk,
        recommendedSmes: updated.recommended_smes,
        missingInputs: updated.missing_inputs,
      },
      message: 'Topic updated and scored successfully',
    });
  } catch (error) {
    console.error('[API] Topic edit error:', error);
    return NextResponse.json(
      { error: 'Failed to edit topic', message: (error as Error).message },
      { status: 500 }
    );
  }
}
