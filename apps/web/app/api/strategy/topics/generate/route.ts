// API route: POST /api/strategy/topics/generate — Generate topic candidates via LLM

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';
import { scoreAndBuildTopic, persistTopic, topicStore } from '@/lib/topic-store';
import { strategyStore } from '@/lib/strategy-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, seed } = body as { strategyId?: string; seed?: string };

    console.log('[API] Generate topics request:', { strategyId, seed });

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    const strategy = strategyStore.get(strategyId);
    if (!strategy) {
      console.error('[API] Strategy not found:', strategyId);
      console.error('[API] Available strategies:', Array.from(strategyStore.keys()));
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    console.log('[API] Strategy found:', strategy.id, strategy.title);

    const provider = await getTextModelProvider();
    console.log('[API] Text model provider ready');

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

    console.log('[API] Generated', rawCandidates.length, 'topic candidates');

    // Score each candidate and persist
    const scored = rawCandidates.map((c) => {
      try {
        return scoreAndBuildTopic(c, strategy);
      } catch (scoreErr) {
        console.error('[API] Error scoring topic:', c.title, scoreErr);
        throw scoreErr;
      }
    });

    console.log('[API] Scored', scored.length, 'topics');

    let allTopics = topicStore.get(strategyId) || [];
    for (const topic of scored) {
      allTopics = persistTopic(strategyId, topic);
    }

    console.log('[API] Persisted topics, total now:', allTopics.length);

    return NextResponse.json({
      success: true,
      requested: 10,
      generated: scored,
      topics: allTopics,
      strategyId,
    });
  } catch (error) {
    console.error('[API] Topic generation error:', error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[API] Error stack:', stack);

    return NextResponse.json(
      {
        error: 'Failed to generate topics',
        message,
        details: stack?.split('\n').slice(0, 3).join(' '),
      },
      { status: 500 }
    );
  }
}
