// API route: /api/strategy/topics — Create and retrieve user-defined topics
// Fetches from database, never from memory store

import { NextRequest, NextResponse } from 'next/server';
import { scoreAndBuildTopic } from '@/lib/topic-store';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

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
    const { strategyId, strategy, topic, action } = body;

    if (!strategyId || !strategy) {
      return NextResponse.json(
        { error: 'strategyId and strategy are required' },
        { status: 400 }
      );
    }

    if (action === 'create' && topic) {
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

      const scoredTopic = scoreAndBuildTopic(topic, normalizedStrategy);

      // Save to database
      const supabase = createServerClient();
      const { error: insertError } = await supabase
        .from('topic_candidates')
        .insert({
          id: scoredTopic.id,
          workspace_id: workspace.workspaceId,
          strategy_id: strategyId,
          title: scoredTopic.title,
          summary: scoredTopic.summary,
          angle: scoredTopic.angle,
          format: scoredTopic.format || 'blog',
          geography: scoredTopic.geography,
          audience: scoredTopic.audience,
          target_offering: scoredTopic.targetOffering,
          score: scoredTopic.score,
          confidence: scoredTopic.confidence,
          breakdown: scoredTopic.breakdown,
          cannibalization_risk: scoredTopic.cannibalizationRisk,
          recommended_smes: scoredTopic.recommendedSmes,
          missing_inputs: scoredTopic.missingInputs,
        });

      if (insertError) {
        console.error('[API] Topic insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to save topic' },
          { status: 400 }
        );
      }

      // Fetch updated list from database
      const { data: topics } = await supabase
        .from('topic_candidates')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('workspace_id', workspace.workspaceId);

      return NextResponse.json({
        success: true,
        topic: scoredTopic,
        topics: topics || [],
        message: 'Topic created and scored successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use action: "create"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Topic creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create topic', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const strategyId = request.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: topics, error } = await supabase
      .from('topic_candidates')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('workspace_id', workspace.workspaceId);

    if (error) {
      console.error('[API] Topic fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      strategyId,
      topicCount: topics?.length || 0,
      topics: topics || [],
    });
  } catch (error) {
    console.error('[API] Topic retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve topics', message: (error as Error).message },
      { status: 500 }
    );
  }
}
