// API route: /api/strategy/topics — Create and retrieve user-defined topics
// Uses database with fallback to in-memory store for development

import { NextRequest, NextResponse } from 'next/server';
import { scoreAndBuildTopic, persistTopic, topicStore } from '@/lib/topic-store';

// Try to load database client; it will be null if DATABASE_URL not set
let topicRepository: any = null;
try {
  if (process.env.DATABASE_URL) {
    const dbModule = require('@blog-agent/db');
    topicRepository = dbModule.topicRepository;
  }
} catch (e) {
  console.warn('[API] Database not available, using in-memory store');
}

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

      // Persist to database if available
      if (topicRepository) {
        try {
          await topicRepository.create({
            id: scoredTopic.id,
            workspaceId: 'default-workspace',
            strategyId,
            title: scoredTopic.title,
            summary: scoredTopic.summary,
            angle: scoredTopic.angle,
            format: scoredTopic.format || 'blog',
            geography: scoredTopic.geography,
            audience: scoredTopic.audience,
            targetOffering: scoredTopic.targetOffering,
            score: scoredTopic.score,
            confidence: scoredTopic.confidence,
            breakdown: scoredTopic.breakdown,
            cannibalizationRisk: scoredTopic.cannibalizationRisk,
            recommendedSmes: scoredTopic.recommendedSmes,
            missingInputs: scoredTopic.missingInputs,
          });
        } catch (dbError) {
          console.warn('[API] Database insert failed, falling back to in-memory store:', dbError);
          persistTopic(strategyId, scoredTopic);
        }
      } else {
        // Persist to topicStore
        persistTopic(strategyId, scoredTopic);
      }

      // Get updated list from appropriate source
      let updatedList;
      if (topicRepository) {
        try {
          const dbTopics = await topicRepository.listByStrategy('default-workspace', strategyId);
          updatedList = dbTopics;
        } catch (dbError) {
          updatedList = topicStore.get(strategyId) || [];
        }
      } else {
        updatedList = topicStore.get(strategyId) || [];
      }

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
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || 'default-workspace';

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    let topics;

    if (topicRepository) {
      try {
        const dbTopics = await topicRepository.listByStrategy(workspaceId, strategyId);
        topics = dbTopics.map((t: any) => ({
          id: t.id,
          title: t.title,
          summary: t.summary,
          angle: t.angle,
          format: t.format,
          geography: t.geography,
          audience: t.audience,
          targetOffering: t.targetOffering,
          score: t.score,
          confidence: t.confidence,
          breakdown: t.breakdown,
          cannibalizationRisk: t.cannibalizationRisk,
          recommendedSmes: t.recommendedSmes,
          missingInputs: t.missingInputs,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }));
      } catch (dbError) {
        console.warn('[API] Database query failed, falling back to in-memory store:', dbError);
        topics = topicStore.get(strategyId) || [];
      }
    } else {
      topics = topicStore.get(strategyId) || [];
    }

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
