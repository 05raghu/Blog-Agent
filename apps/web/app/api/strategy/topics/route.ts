// API route: /api/strategy/topics — Create and retrieve user-defined topics

import { NextRequest, NextResponse } from 'next/server';
import { scoreAndBuildTopic, persistTopic, topicStore } from '@/lib/topic-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, strategy, topic, action } = body;

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

      // Score and build the topic
      const scoredTopic = scoreAndBuildTopic(topic, strategy);

      // Persist to topicStore
      const updatedList = persistTopic(strategyId, scoredTopic);

      return NextResponse.json({
        success: true,
        topic: scoredTopic,
        topics: updatedList,
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
    const strategyId = request.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    const topics = topicStore.get(strategyId) || [];
    return NextResponse.json({
      strategyId,
      topicCount: topics.length,
      topics,
    });
  } catch (error) {
    console.error('[API] Topic retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve topics', message: (error as Error).message },
      { status: 500 }
    );
  }
}
