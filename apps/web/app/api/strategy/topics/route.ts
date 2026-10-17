// API route: /api/strategy/topics — Create and retrieve user-defined topics
// Auto-scores using LLM (Claude, OpenAI, or Mock) with real market demand data

import { NextRequest, NextResponse } from 'next/server';
import { generateTopicId } from '@/lib/topic-store';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';
import { getTopicScorerProvider } from '@/lib/topic-scorer';
import { getSearchDemandProvider } from '@/lib/search-demand';

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

      // Normalize strategy
      const normalizedStrategy = {
        offerings: strategy.offerings || [],
        targetIcps: strategy.targetIcps || strategy.icps || [],
        geographies: strategy.geographies || [],
        competitors: strategy.competitors || [],
        contentMix: strategy.contentMix || {},
      };

      try {
        // Get LLM scorer (Claude, OpenAI, or Mock)
        const scorer = await getTopicScorerProvider();

        // Get real market demand data
        let searchDemand = null;
        try {
          const demandProvider = await getSearchDemandProvider();
          const demandData = await demandProvider.getSearchDemand({
            topic: topic.title,
            keywords: topic.angle ? [topic.angle] : [],
          });
          searchDemand = {
            estimatedMonthlySearches: demandData.estimatedMonthlySearches,
            demandLevel: demandData.demandLevel,
            resultCount: demandData.resultCount,
            trending: demandData.trending,
            confidence: demandData.confidence,
          };
          console.log('[API] Got search demand data:', searchDemand);
        } catch (demandErr) {
          console.warn('[API] Failed to get search demand:', demandErr);
          // Continue without demand data
        }

        // Score the topic using LLM with market demand data
        console.log('[API] Auto-scoring topic with LLM:', topic.title.substring(0, 50));
        const llmScore = await scorer.scoreTopic({
          topic,
          strategy: normalizedStrategy,
          searchDemand: searchDemand || undefined,
        });

        // Generate ID for topic
        const topicId = generateTopicId();

        // Build topic object with LLM score
        const scoredTopic = {
          id: topicId,
          title: topic.title,
          summary: topic.summary || '',
          format: topic.format || 'blog',
          angle: topic.angle,
          targetOffering: topic.targetOffering,
          geography: topic.geography,
          audience: topic.audience,
          score: llmScore.totalScore,
          confidence: llmScore.confidence,
          breakdown: {
            strategicRelevance: {
              score: llmScore.breakdown.strategicRelevance.score,
              evidence: llmScore.breakdown.strategicRelevance.reasoning,
            },
            audienceIcpUsefulness: {
              score: llmScore.breakdown.audienceIcpUsefulness.score,
              evidence: llmScore.breakdown.audienceIcpUsefulness.reasoning,
            },
            availableEvidenceAndDemand: {
              score: llmScore.breakdown.availableEvidenceAndDemand.score,
              evidence: llmScore.breakdown.availableEvidenceAndDemand.reasoning,
            },
            differentiatedAngle: {
              score: llmScore.breakdown.differentiatedAngle.score,
              evidence: llmScore.breakdown.differentiatedAngle.reasoning,
            },
            smeFit: {
              score: llmScore.breakdown.smeFit.score,
              evidence: llmScore.breakdown.smeFit.reasoning,
            },
            searchContentGap: {
              score: llmScore.breakdown.searchContentGap.score,
              evidence: llmScore.breakdown.searchContentGap.reasoning,
            },
            conversionDistributionPotential: {
              score: llmScore.breakdown.conversionDistributionPotential.score,
              evidence: llmScore.breakdown.conversionDistributionPotential.reasoning,
            },
          },
          cannibalizationRisk: { exists: false },
          recommendedSmes: [],
          missingInputs: [],
          createdAt: new Date().toISOString(),
          llmScoringData: llmScore, // Store full LLM breakdown
        };

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
          message: 'Topic created and auto-scored with LLM successfully',
        });
      } catch (scoreError) {
        console.error('[API] LLM scoring error:', scoreError);
        return NextResponse.json(
          { error: 'Failed to score topic with LLM', message: (scoreError as Error).message },
          { status: 500 }
        );
      }
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
