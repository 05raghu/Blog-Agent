// API route: GET/POST/PUT/DELETE /api/sme
// Manages SME profiles at workspace-level

import { NextRequest, NextResponse } from 'next/server';
import { getSMEsByWorkspace, addSME, updateSME, deleteSME } from '@/lib/sme-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';

    const smes = getSMEsByWorkspace(workspaceId);

    return NextResponse.json({
      success: true,
      workspaceId,
      smes,
    });
  } catch (error) {
    console.error('[API] SME fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SME profiles', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId = 'default-workspace', sme } = body;

    if (!sme?.name || !sme?.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const newSME = addSME(workspaceId, {
      ...sme,
      workspaceId,
    });

    return NextResponse.json({
      success: true,
      sme: newSME,
    });
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
    const { workspaceId = 'default-workspace', smeId, sme } = body;

    if (!smeId) {
      return NextResponse.json({ error: 'SME ID is required' }, { status: 400 });
    }

    const updated = updateSME(workspaceId, smeId, {
      ...sme,
      workspaceId,
    });

    if (!updated) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      sme: updated,
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
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';
    const smeId = searchParams.get('smeId');

    if (!smeId) {
      return NextResponse.json({ error: 'SME ID is required' }, { status: 400 });
    }

    const deleted = deleteSME(workspaceId, smeId);

    if (!deleted) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'SME profile deleted',
    });
  } catch (error) {
    console.error('[API] SME deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete SME profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}
