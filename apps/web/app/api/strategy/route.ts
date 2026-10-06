// API route: POST/GET /api/strategy — Manage editorial strategy
// Uses database with fallback to in-memory store for development

import { NextRequest, NextResponse } from 'next/server';
import { strategyStore } from '@/lib/strategy-store';
import { getWorkspaceContext } from '@/lib/workspace-auth';

// Try to load database client; it will be null if DATABASE_URL not set
let strategyRepository: any = null;
try {
  if (process.env.DATABASE_URL) {
    const dbModule = require('@blog-agent/db');
    strategyRepository = dbModule.strategyRepository;
  }
} catch (e) {
  console.warn('[API] Database not available, using in-memory store');
}

export async function POST(request: NextRequest) {
  try {
    // Get workspace from authenticated user
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, offerings, targetIcps, icps, geographies, competitors, contentMix, description } = body;
    const workspaceId = workspace.workspaceId;

    if (!offerings || !Array.isArray(offerings)) {
      return NextResponse.json(
        { error: 'offerings is required and must be an array' },
        { status: 400 }
      );
    }

    const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create strategy version
    const strategyVersion: any = {
      id: strategyId,
      workspaceId,
      version: 1,
      title: title || 'Default Strategy',
      offerings,
      icps: icps || targetIcps || [],
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

    if (strategyRepository) {
      try {
        await strategyRepository.create({
          id: strategyId,
          workspaceId,
          version: 1,
          offerings,
          icps: icps || targetIcps || [],
          geographies: geographies || [],
          competitors: competitors || [],
          editorialVerticals: [],
          contentMix: contentMix || {},
          qualityThresholds: {},
          sourcePolicy: {},
          approvalPolicy: {},
          smePolicies: {},
        });
      } catch (dbError) {
        console.warn('[API] Database insert failed, falling back to in-memory store:', dbError);
        strategyStore.set(strategyId, strategyVersion);
      }
    } else {
      strategyStore.set(strategyId, strategyVersion);
    }

    return NextResponse.json({
      id: strategyVersion.id,
      title: strategyVersion.title,
      offerings: strategyVersion.offerings,
      targetIcps: strategyVersion.icps,
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
    // Get workspace from authenticated user
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const strategyId = request.nextUrl.searchParams.get('id');
    const workspaceId = workspace.workspaceId;

    if (!strategyId) {
      // Return all strategies for workspace
      let strategies;

      if (strategyRepository) {
        try {
          const dbStrategies = await strategyRepository.listByWorkspace(workspaceId);
          strategies = dbStrategies.map((s: any) => ({
            id: s.id,
            title: s.title || 'Default Strategy',
            offerings: s.offerings || [],
            targetIcps: s.icps || [],
            geographies: s.geographies || [],
            competitors: s.competitors || [],
            contentMix: s.contentMix || {},
            createdAt: s.createdAt,
          }));
        } catch (dbError) {
          console.warn('[API] Database query failed, falling back to in-memory store:', dbError);
          strategies = Array.from(strategyStore.values()).map((s: any) => ({
            id: s.id,
            title: s.title,
            offerings: s.offerings,
            targetIcps: s.targetIcps,
            geographies: s.geographies,
            competitors: s.competitors,
            contentMix: s.contentMix,
            createdAt: s.createdAt,
          }));
        }
      } else {
        strategies = Array.from(strategyStore.values()).map((s: any) => ({
          id: s.id,
          title: s.title,
          offerings: s.offerings,
          targetIcps: s.targetIcps,
          geographies: s.geographies,
          competitors: s.competitors,
          contentMix: s.contentMix,
          createdAt: s.createdAt,
        }));
      }

      return NextResponse.json({ strategies });
    }

    // Return specific strategy
    let strategy;

    if (strategyRepository) {
      try {
        strategy = await strategyRepository.getById(workspaceId, strategyId);
      } catch (dbError) {
        console.warn('[API] Database query failed, falling back to in-memory store:', dbError);
        strategy = strategyStore.get(strategyId);
      }
    } else {
      strategy = strategyStore.get(strategyId);
    }

    if (!strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Handle both database (icps) and in-memory (targetIcps) field names
    const targetIcps = (strategy as any).icps || (strategy as any).targetIcps || [];

    return NextResponse.json({
      id: strategy.id,
      title: strategy.title || 'Default Strategy',
      offerings: strategy.offerings || [],
      targetIcps,
      geographies: strategy.geographies || [],
      competitors: strategy.competitors || [],
      contentMix: strategy.contentMix || {},
      createdAt: strategy.createdAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve strategy', message: (error as Error).message },
      { status: 500 }
    );
  }
}
