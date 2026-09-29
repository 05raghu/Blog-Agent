// API route: POST /api/strategy/topics/generate — Generate topic candidates via LLM

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';
import { scoreAndBuildTopic, persistTopic, topicStore } from '@/lib/topic-store';
import { strategyStore } from '@/lib/strategy-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, seed } = body as { strategyId?: string; seed?: string };

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    const strategy = strategyStore.get(strategyId);
    if (!strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    const provider = await getTextModelProvider();
    const rawCandidates = await provider.generateTopicCandidates({
      strategy: {
        offerings: strategy.offerings || [],
        targetIcps: strategy.targetIcps || [],
        geographies: strategy.geographies || [],
        competitors: strategy.competitors || [],
        contentMix: strategy.contentMix || {},
      },
      seed: seed?.trim() || undefined,
      count: 10,
    });

    // Score each candidate and persist
    const scored = rawCandidates.map((c) => scoreAndBuildTopic(c, strategy));

    let allTopics = topicStore.get(strategyId) || [];
    for (const topic of scored) {
      allTopics = persistTopic(strategyId, topic);
    }

    return NextResponse.json({
      success: true,
      requested: 10,
      generated: scored,
      topics: allTopics,
      strategyId,
    });
  } catch (error) {
    console.error('[API] Topic generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate topics', message: (error as Error).message },
      { status: 500 }
    );
  }
}
