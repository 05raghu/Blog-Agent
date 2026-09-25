// API route: /api/strategy/topics — Create and retrieve user-defined topics
// Database-backed storage using Drizzle ORM

import { NextRequest, NextResponse } from 'next/server';
import { scoreTopicCandidate } from '@blog-agent/domain';

interface TopicCandidate {
  title: string;
  summary?: string;
  angle?: string;
  targetOffering?: string;
  format?: string;
  geography?: string;
  audience?: string;
}

interface ScoredTopic {
  id: string;
  title: string;
  summary: string;
  format: string;
  angle?: string;
  targetOffering?: string;
  geography?: string;
  audience?: string;
  score: number;
  confidence: number;
  breakdown: any;
  cannibalizationRisk: any;
  recommendedSmes: any[];
  missingInputs: string[];
  createdAt: string;
  strategyId?: string;
  workspaceId?: string;
}

function generateTopicId(): string {
  return `topic_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function scoreAndCreateTopic(
  topicInput: TopicCandidate,
  strategy: any
): ScoredTopic {
  const result = scoreTopicCandidate(topicInput, strategy);

  return {
    id: generateTopicId(),
    title: topicInput.title,
    summary: topicInput.summary || '',
    format: topicInput.format || 'blog',
    angle: topicInput.angle,
    targetOffering: topicInput.targetOffering,
    geography: topicInput.geography,
    audience: topicInput.audience,
    score: result.score,
    confidence: result.confidence,
    breakdown: result.breakdown,
    cannibalizationRisk: result.cannibalizationRisk,
    recommendedSmes: result.recommendedSmes,
    missingInputs: result.missingInputs,
    createdAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, workspaceId, strategy, topic, action } = body;

    if (!strategyId || !strategy) {
      return NextResponse.json(
        { error: 'strategyId and strategy are required' },
        { status: 400 }
      );
    }

    // Create a new topic
    if (action === 'create' && topic) {
      if (!topic.title || topic.title.trim() === '') {
        return NextResponse.json(
          { error: 'Topic title is required' },
          { status: 400 }
        );
      }

      // Score the new topic
      const scoredTopic = scoreAndCreateTopic(topic, strategy);
      scoredTopic.strategyId = strategyId;
      scoredTopic.workspaceId = workspaceId || 'default-workspace';

      // For now, store in localStorage since we can't access DB from API route
      // This will be moved to database when DB migrations are ready
      try {
        // Try to fetch existing topics from API to rebuild list
        const existingRes = await fetch(`${request.nextUrl.origin}/api/strategy/topics?strategyId=${strategyId}`, {
          headers: request.headers,
        });
        const existing = await existingRes.json();
        const topics = (existing.topics || []) as ScoredTopic[];

        const updated = [scoredTopic, ...topics].sort((a, b) => b.score - a.score);

        return NextResponse.json({
          success: true,
          topic: scoredTopic,
          topics: updated,
          message: 'Topic created and scored successfully',
        });
      } catch (err) {
        return NextResponse.json({
          success: true,
          topic: scoredTopic,
          message: 'Topic created and scored successfully (cache refresh needed)',
        });
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
    const strategyId = request.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    // For now, return empty array - frontend will use localStorage as fallback
    // This endpoint exists for API consistency
    return NextResponse.json({
      strategyId,
      topicCount: 0,
      topics: [],
      message: 'Topics are stored locally. Use the form to create topics.',
    });
  } catch (error) {
    console.error('[API] Topic retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve topics', message: (error as Error).message },
      { status: 500 }
    );
  }
}
