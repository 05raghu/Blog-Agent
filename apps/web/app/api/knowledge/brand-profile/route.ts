// API route: GET/POST /api/knowledge/brand-profile
// Manages brand guidelines and voice profile

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for brand profiles (will be replaced with DB)
declare global {
  var _brandProfileStore: Map<string, any> | undefined;
}

const brandProfileStore = global._brandProfileStore || new Map();
global._brandProfileStore = brandProfileStore;

export { brandProfileStore };

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const strategyId = searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json(
        { error: 'Missing required parameter: strategyId' },
        { status: 400 }
      );
    }

    const profile = brandProfileStore.get(strategyId);

    if (!profile) {
      return NextResponse.json({
        profile: null,
        message: 'No brand profile found for this strategy',
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[API] Brand profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, guidelines, strongExemplars, weakExemplars, approvalStatus } = body;

    if (!strategyId || !guidelines) {
      return NextResponse.json(
        { error: 'Missing required fields: strategyId, guidelines' },
        { status: 400 }
      );
    }

    const profile = {
      id: `brand_${strategyId}`,
      strategyId,
      guidelines,
      strongExemplars: strongExemplars || [],
      weakExemplars: weakExemplars || [],
      approvalStatus: approvalStatus || 'pending', // pending | approved
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    brandProfileStore.set(strategyId, profile);

    console.log(`[API] Brand profile ${approvalStatus === 'approved' ? 'approved' : 'saved'} for strategy ${strategyId}`);

    return NextResponse.json({
      success: true,
      profile,
      message: approvalStatus === 'approved'
        ? 'Brand profile approved! Sources will now be scored against this profile.'
        : 'Brand profile saved (pending approval)',
    });
  } catch (error) {
    console.error('[API] Brand profile save error:', error);
    return NextResponse.json(
      { error: 'Failed to save brand profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}
