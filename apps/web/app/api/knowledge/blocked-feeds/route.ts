// API route: GET/POST /api/knowledge/blocked-feeds
// Manages blocked/excluded feed paths per strategy

import { NextRequest, NextResponse } from 'next/server';

declare global {
  var _blockedFeedsStore: Map<string, string[]> | undefined;
}

const blockedFeedsStore = global._blockedFeedsStore || new Map();
global._blockedFeedsStore = blockedFeedsStore;

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

    const blockedFeeds = blockedFeedsStore.get(strategyId) || ['/feeds/blog/']; // Default

    return NextResponse.json({ blockedFeeds });
  } catch (error) {
    console.error('[API] Blocked feeds fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked feeds', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, blockedFeeds } = body;

    if (!strategyId) {
      return NextResponse.json(
        { error: 'Missing required field: strategyId' },
        { status: 400 }
      );
    }

    // Validate blocked feeds format (should be array of paths)
    if (!Array.isArray(blockedFeeds)) {
      return NextResponse.json(
        { error: 'blockedFeeds must be an array of paths' },
        { status: 400 }
      );
    }

    // Clean up paths (remove empty strings, trim whitespace)
    const cleanedFeeds = blockedFeeds
      .map((feed: string) => feed.trim())
      .filter((feed: string) => feed.length > 0);

    blockedFeedsStore.set(strategyId, cleanedFeeds);

    console.log(`[API] Updated blocked feeds for strategy ${strategyId}:`, cleanedFeeds);

    return NextResponse.json({
      success: true,
      blockedFeeds: cleanedFeeds,
      message: `Blocked ${cleanedFeeds.length} feed path(s) for this strategy`,
    });
  } catch (error) {
    console.error('[API] Blocked feeds save error:', error);
    return NextResponse.json(
      { error: 'Failed to save blocked feeds', message: (error as Error).message },
      { status: 500 }
    );
  }
}
