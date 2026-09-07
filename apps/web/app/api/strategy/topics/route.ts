// API route: POST /api/strategy/topics — Generate topic candidates

import { NextRequest, NextResponse } from 'next/server';
import { scoreTopicCandidate } from '@blog-agent/domain';
import { MOCK_TOPICS } from './mock-topics';

interface TopicCandidateWithScore {
  id: string;
  title: string;
  summary: string;
  format: string;
  score: number;
  breakdown: Record<string, number>;
  createdAt: string;
}

// Temporary in-memory store
const topicStore = new Map<string, TopicCandidateWithScore[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, strategy } = body;

    if (!strategy) {
      return NextResponse.json(
        { error: 'strategy is required' },
        { status: 400 }
      );
    }

    // Score all mock topics against this strategy
    const scoredTopics = MOCK_TOPICS.map((topic) => {
      const result = scoreTopicCandidate(topic, strategy);
      return {
        id: `topic_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: topic.title,
        summary: topic.summary || '',
        format: topic.format || 'blog',
        score: result.score,
        breakdown: result.breakdown,
        createdAt: new Date().toISOString(),
      };
    }).sort((a, b) => b.score - a.score); // Sort by score descending

    // Store in memory
    if (strategyId) {
      topicStore.set(strategyId, scoredTopics);
    }

    return NextResponse.json({
      strategyId,
      topicCount: scoredTopics.length,
      topics: scoredTopics.slice(0, 10), // Return top 10
    });
  } catch (error) {
    console.error('[API] Topic generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate topics', message: (error as Error).message },
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

    const topics = topicStore.get(strategyId);
    if (!topics) {
      return NextResponse.json({ error: 'Topics not found for this strategy' }, { status: 404 });
    }

    return NextResponse.json({
      strategyId,
      topicCount: topics.length,
      topics: topics.slice(0, 10), // Return top 10
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve topics', message: (error as Error).message },
      { status: 500 }
    );
  }
}
