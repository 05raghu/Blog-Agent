// API route: GET /api/briefing/[sessionId]/insights
// Extract and structure insights from a completed briefing session

import { NextResponse } from 'next/server';

export async function GET() {
  try {

    // Get briefing session from localStorage (via client-side fetch since this is a backend route)
    // In a real app, this would query a database
    // For now, we'll expect the client to provide the session data, or we can fetch from the
    // in-memory store if we create one

    // For now, return a structure that expects the client to pass session data
    return NextResponse.json({
      status: 'error',
      message: 'This endpoint requires client-side session data. Call extractInsights() utility directly.',
    });
  } catch (error) {
    console.error('[API] Briefing insights extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract insights', message: (error as Error).message },
      { status: 500 }
    );
  }
}
