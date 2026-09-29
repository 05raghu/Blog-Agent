// API route: POST/GET /api/strategy — Manage editorial strategy

import { NextRequest, NextResponse } from 'next/server';
import { strategyStore } from '@/lib/strategy-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, offerings, targetIcps, geographies, competitors, contentMix, description } = body;

    if (!offerings || !Array.isArray(offerings)) {
      return NextResponse.json(
        { error: 'offerings is required and must be an array' },
        { status: 400 }
      );
    }

    // Create strategy version
    const strategyVersion: any = {
      id: `strategy_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      workspaceId: 'default-workspace', // TODO: use actual workspace from auth
      title: title || 'Default Strategy',
      offerings,
      targetIcps: targetIcps || [],
      geographies: geographies || [],
      competitors: competitors || [],
      contentMix: contentMix || {},
      rubricWeights: {
        icpFit: 20,
        competitiveMoat: 20,
        contentMixAlignment: 20,
        offeringRelevance: 20,
        volumePotential: 20,
      },
      description,
      createdAt: new Date(),
      createdBy: 'system', // TODO: use actual user from auth
    };

    strategyStore.set(strategyVersion.id, strategyVersion);

    return NextResponse.json({
      id: strategyVersion.id,
      title: strategyVersion.title,
      offerings: strategyVersion.offerings,
      targetIcps: strategyVersion.targetIcps,
      geographies: strategyVersion.geographies,
      competitors: strategyVersion.competitors,
      contentMix: strategyVersion.contentMix,
      createdAt: strategyVersion.createdAt,
    });
  } catch (error) {
    console.error('[API] Strategy creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create strategy', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const strategyId = request.nextUrl.searchParams.get('id');

    if (!strategyId) {
      // Return all strategies
      const strategies = Array.from(strategyStore.values()).map((s) => ({
        id: s.id,
        title: s.title,
        offerings: s.offerings,
        targetIcps: s.targetIcps,
        createdAt: s.createdAt,
      }));

      return NextResponse.json({ strategies });
    }

    // Return specific strategy
    const strategy = strategyStore.get(strategyId);
    if (!strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: strategy.id,
      title: strategy.title,
      offerings: strategy.offerings,
      targetIcps: strategy.targetIcps,
      geographies: strategy.geographies,
      competitors: strategy.competitors,
      contentMix: strategy.contentMix,
      createdAt: strategy.createdAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve strategy', message: (error as Error).message },
      { status: 500 }
    );
  }
}
