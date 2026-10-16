// API route: POST /api/strategy/topics/generate — Generate topic candidates via LLM
// Fetches strategy from database, generates topics via LLM, persists to database

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';
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
    const { strategyId, seed } = body as { strategyId?: string; seed?: string };

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch strategy from database
    const { data: dbStrategy, error: strategyError } = await supabase
      .from('strategy_versions')
      .select('*')
      .eq('id', strategyId)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (strategyError || !dbStrategy) {
      console.error('[API] Strategy not found:', strategyId);
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    const strategy = {
      offerings: dbStrategy.offerings || [],
      targetIcps: dbStrategy.icps || [],
      geographies: dbStrategy.geographies || [],
      competitors: dbStrategy.competitors || [],
      contentMix: dbStrategy.content_mix || {},
    };

    const provider = await getTextModelProvider();

    // Generate topic candidates via LLM
    const rawCandidates = await provider.generateTopicCandidates({
      strategy,
      seed: seed?.trim() || undefined,
      count: 10,
    });

    // Score each candidate
    const scored = rawCandidates.map((c) => {
      return scoreAndBuildTopic(c, strategy);
    });

    // Persist all scored topics to database
    const { error: insertError } = await supabase
      .from('topic_candidates')
      .insert(
        scored.map((topic) => ({
          id: topic.id,
          workspace_id: workspace.workspaceId,
          strategy_id: strategyId,
          title: topic.title,
          summary: topic.summary,
          angle: topic.angle,
          format: topic.format || 'blog',
          geography: topic.geography,
          audience: topic.audience,
          target_offering: topic.targetOffering,
          score: topic.score,
          confidence: topic.confidence,
          breakdown: topic.breakdown,
          cannibalization_risk: topic.cannibalizationRisk,
          recommended_smes: topic.recommendedSmes,
          missing_inputs: topic.missingInputs,
        }))
      );

    if (insertError) {
      console.error('[API] Error persisting topics:', insertError);
      return NextResponse.json(
        { error: 'Failed to save generated topics' },
        { status: 400 }
      );
    }

    // Fetch updated list from database
    const { data: allTopics } = await supabase
      .from('topic_candidates')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('workspace_id', workspace.workspaceId);

    return NextResponse.json({
      success: true,
      requested: 10,
      generated: scored,
      topics: allTopics || [],
      strategyId,
    });
  } catch (error) {
    console.error('[API] Topic generation error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Failed to generate topics',
        message,
      },
      { status: 500 }
    );
  }
}
