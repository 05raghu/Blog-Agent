// API route: /api/sme — SME Profile CRUD operations
// In-memory store with localStorage fallback (will migrate to DB later)

import { NextRequest, NextResponse } from 'next/server';

interface SMEProfile {
  id: string;
  strategyId: string;
  name: string;
  email: string;
  expertise: string[];
  biography?: string;
  capacityHoursPerMonth: number;
  hoursUsed?: number;
  pastContributions?: string[];
  createdAt: string;
}

// In-memory store: strategyId → [SMEProfile]
const smeStore = new Map<string, SMEProfile[]>();

function generateSMEId(): string {
  return `sme_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export async function GET(request: NextRequest) {
  try {
    const strategyId = request.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    const smes = smeStore.get(strategyId) || [];

    return NextResponse.json({
      strategyId,
      smeCount: smes.length,
      smes,
    });
  } catch (error) {
    console.error('[API] SME retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve SMEs', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, sme, action } = body;

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId is required' }, { status: 400 });
    }

    if (action === 'create' && sme) {
      if (!sme.name?.trim() || !sme.email?.trim()) {
        return NextResponse.json(
          { error: 'Name and email are required' },
          { status: 400 }
        );
      }

      const newSME: SMEProfile = {
        id: generateSMEId(),
        strategyId,
        name: sme.name,
        email: sme.email,
        expertise: sme.expertise || [],
        biography: sme.biography,
        capacityHoursPerMonth: sme.capacityHoursPerMonth || 10,
        hoursUsed: 0,
        pastContributions: [],
        createdAt: new Date().toISOString(),
      };

      // Add to in-memory store
      const existing = smeStore.get(strategyId) || [];
      smeStore.set(strategyId, [newSME, ...existing]);

      return NextResponse.json({
        success: true,
        sme: newSME,
        message: 'SME profile created successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use action: "create"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] SME creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create SME profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, smeId, sme } = body;

    if (!strategyId || !smeId) {
      return NextResponse.json(
        { error: 'strategyId and smeId are required' },
        { status: 400 }
      );
    }

    const updated: SMEProfile = {
      id: smeId,
      strategyId,
      name: sme.name,
      email: sme.email,
      expertise: sme.expertise || [],
      biography: sme.biography,
      capacityHoursPerMonth: sme.capacityHoursPerMonth,
      hoursUsed: sme.hoursUsed || 0,
      pastContributions: sme.pastContributions || [],
      createdAt: sme.createdAt,
    };

    // Update in-memory store
    const existing = smeStore.get(strategyId) || [];
    const updatedList = existing.map((s) => (s.id === smeId ? updated : s));
    smeStore.set(strategyId, updatedList);

    return NextResponse.json({
      success: true,
      sme: updated,
      message: 'SME profile updated successfully',
    });
  } catch (error) {
    console.error('[API] SME update error:', error);
    return NextResponse.json(
      { error: 'Failed to update SME profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const strategyId = searchParams.get('strategyId');
    const smeId = searchParams.get('smeId');

    if (!strategyId || !smeId) {
      return NextResponse.json(
        { error: 'strategyId and smeId are required' },
        { status: 400 }
      );
    }

    // Delete from in-memory store
    const existing = smeStore.get(strategyId) || [];
    const updated = existing.filter((s) => s.id !== smeId);
    smeStore.set(strategyId, updated);

    return NextResponse.json({
      success: true,
      message: 'SME profile deleted successfully',
    });
  } catch (error) {
    console.error('[API] SME deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete SME profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}
