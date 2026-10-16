// API endpoint for LLM-based topic scoring
// POST /api/topics/score

import { getTopicScorerProvider } from '@/lib/topic-scorer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, strategy } = body;

    if (!topic || !strategy) {
      return Response.json(
        { error: 'Missing topic or strategy' },
        { status: 400 }
      );
    }

    if (!topic.title) {
      return Response.json(
        { error: 'Topic must have a title' },
        { status: 400 }
      );
    }

    if (!strategy.offerings || strategy.offerings.length === 0) {
      return Response.json(
        { error: 'Strategy must have at least one offering' },
        { status: 400 }
      );
    }

    const scorer = await getTopicScorerProvider();

    const result = await scorer.scoreTopic({
      topic: {
        title: topic.title,
        summary: topic.summary,
        angle: topic.angle,
        targetOffering: topic.targetOffering,
        format: topic.format,
        geography: topic.geography,
        audience: topic.audience,
      },
      strategy: {
        offerings: strategy.offerings || [],
        targetIcps: strategy.targetIcps || [],
        geographies: strategy.geographies || [],
        competitors: strategy.competitors || [],
        contentMix: strategy.contentMix || {},
      },
    });

    return Response.json({
      success: true,
      score: result,
    });
  } catch (error) {
    console.error('[TopicScore API] Error:', error);
    return Response.json(
      { error: 'Failed to score topic', details: String(error) },
      { status: 500 }
    );
  }
}
