// API route: /api/briefing — Briefing Session CRUD operations
// In-memory store with localStorage fallback (will migrate to DB later)

import { NextRequest, NextResponse } from 'next/server';

interface BriefingSession {
  id: string;
  strategyId: string;
  topicId: string;
  topicTitle: string;
  smeId: string;
  smeName: string;
  status: 'in_progress' | 'completed';
  questions: Array<{
    id: string;
    text: string;
    order: number;
  }>;
  responses: Record<string, string>;
  startedAt?: string;
  completedAt?: string;
}

// In-memory store: strategyId → [BriefingSession]
const sessionStore = new Map<string, BriefingSession[]>();

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export async function GET(request: NextRequest) {
  try {
    const strategyId = request.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    const sessions = sessionStore.get(strategyId) || [];

    return NextResponse.json({
      strategyId,
      sessionCount: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('[API] Briefing session retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sessions', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, session, action } = body;

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    if (action === 'create' && session) {
      const newSession: BriefingSession = {
        id: generateSessionId(),
        strategyId,
        topicId: session.topicId,
        topicTitle: session.topicTitle,
        smeId: session.smeId,
        smeName: session.smeName,
        status: session.status || 'in_progress',
        questions: session.questions || [],
        responses: session.responses || {},
        startedAt: session.startedAt || new Date().toISOString(),
        completedAt: session.completedAt,
      };

      // Add to in-memory store
      const existing = sessionStore.get(strategyId) || [];
      sessionStore.set(strategyId, [newSession, ...existing]);

      return NextResponse.json({
        success: true,
        session: newSession,
        message: 'Briefing session created successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use action: "create"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Briefing session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create briefing session', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, sessionId, session } = body;

    if (!strategyId || !sessionId) {
      return NextResponse.json(
        { error: 'strategyId and sessionId are required' },
        { status: 400 }
      );
    }

    const updated: BriefingSession = {
      id: sessionId,
      strategyId,
      topicId: session.topicId,
      topicTitle: session.topicTitle,
      smeId: session.smeId,
      smeName: session.smeName,
      status: session.status,
      questions: session.questions,
      responses: session.responses,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    };

    // Update in-memory store
    const existing = sessionStore.get(strategyId) || [];
    const updatedList = existing.map((s) => (s.id === sessionId ? updated : s));
    sessionStore.set(strategyId, updatedList);

    return NextResponse.json({
      success: true,
      session: updated,
      message: 'Briefing session updated successfully',
    });
  } catch (error) {
    console.error('[API] Briefing session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update briefing session', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const strategyId = searchParams.get('strategyId');
    const sessionId = searchParams.get('sessionId');

    if (!strategyId || !sessionId) {
      return NextResponse.json(
        { error: 'strategyId and sessionId are required' },
        { status: 400 }
      );
    }

    // Delete from in-memory store
    const existing = sessionStore.get(strategyId) || [];
    const updated = existing.filter((s) => s.id !== sessionId);
    sessionStore.set(strategyId, updated);

    return NextResponse.json({
      success: true,
      message: 'Briefing session deleted successfully',
    });
  } catch (error) {
    console.error('[API] Briefing session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete briefing session', message: (error as Error).message },
      { status: 500 }
    );
  }
}
