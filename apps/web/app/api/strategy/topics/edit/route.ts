// API route: PUT /api/strategy/topics/edit — Edit and recalculate topic score

import { NextRequest, NextResponse } from 'next/server';
import { scoreTopicCandidate } from '@blog-agent/domain';
import { topicStore } from '@/lib/topic-store';

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

    // Get existing topics for this strategy
    const topics = topicStore.get(strategyId) || [];

    // Find the topic to edit
    const topicIndex = topics.findIndex((t) => t.id === topicId);
    if (topicIndex === -1) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Recalculate score with new data
    const scoreResult = scoreTopicCandidate(topic, strategy);

    // Update the topic
    const updatedTopic = {
      ...topics[topicIndex],
      title: topic.title,
      summary: topic.summary || '',
      angle: topic.angle,
      targetOffering: topic.targetOffering,
      geography: topic.geography,
      audience: topic.audience,
      format: topic.format || 'blog',
      score: scoreResult.score,
      confidence: scoreResult.confidence,
      breakdown: scoreResult.breakdown,
      cannibalizationRisk: scoreResult.cannibalizationRisk,
      recommendedSmes: scoreResult.recommendedSmes,
      missingInputs: scoreResult.missingInputs,
      updatedAt: new Date().toISOString(),
    };

    // Update in store
    topics[topicIndex] = updatedTopic;
    topicStore.set(strategyId, topics);

    return NextResponse.json({
      success: true,
      topic: updatedTopic,
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
