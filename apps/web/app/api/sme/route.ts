// API route: GET/POST/PUT/DELETE /api/sme
// Manages SME profiles at workspace-level
// Uses database with fallback to in-memory store for development

import { NextRequest, NextResponse } from 'next/server';
import { getSMEsByWorkspace, addSME, updateSME, deleteSME } from '@/lib/sme-store';

// Try to load database client; it will be null if DATABASE_URL not set
let smeRepository: any = null;
try {
  if (process.env.DATABASE_URL) {
    const dbModule = require('@blog-agent/db');
    smeRepository = dbModule.smeRepository;
  }
} catch (e) {
  console.warn('[API] Database not available, using in-memory store');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';

    let smes;

    if (smeRepository) {
      try {
        const dbSmes = await smeRepository.listByWorkspace(workspaceId);
        smes = dbSmes.map((sme: any) => ({
          id: sme.id,
          workspaceId: sme.workspaceId,
          userId: sme.userId,
          expertise: sme.expertise,
          biography: sme.biography,
          preferredTopics: sme.preferredTopics,
          capacityHoursPerMonth: sme.capacityHoursPerMonth,
          attributionRules: sme.attributionRules,
          pastContributions: sme.pastContributions,
          createdAt: sme.createdAt,
          updatedAt: sme.updatedAt,
        }));
      } catch (dbError) {
        console.warn('[API] Database query failed, falling back to in-memory store:', dbError);
        smes = getSMEsByWorkspace(workspaceId);
      }
    } else {
      smes = getSMEsByWorkspace(workspaceId);
    }

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

    const smeId = sme.id || `sme_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (smeRepository) {
      try {
        await smeRepository.create({
          id: smeId,
          workspaceId,
          userId: sme.userId || sme.email,
          expertise: sme.expertise || [],
          biography: sme.biography,
          preferredTopics: sme.preferredTopics || [],
          capacityHoursPerMonth: sme.capacityHoursPerMonth || 3,
          attributionRules: sme.attributionRules || {},
          pastContributions: sme.pastContributions || [],
        });
      } catch (dbError) {
        console.warn('[API] Database insert failed, falling back to in-memory store:', dbError);
        addSME(workspaceId, {
          ...sme,
          id: smeId,
          workspaceId,
        });
      }
    } else {
      addSME(workspaceId, {
        ...sme,
        id: smeId,
        workspaceId,
      });
    }

    return NextResponse.json({
      success: true,
      sme: {
        id: smeId,
        ...sme,
        workspaceId,
      },
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

    let updated;

    if (smeRepository) {
      try {
        updated = await smeRepository.update(workspaceId, smeId, {
          expertise: sme?.expertise,
          biography: sme?.biography,
          preferredTopics: sme?.preferredTopics,
          capacityHoursPerMonth: sme?.capacityHoursPerMonth,
          attributionRules: sme?.attributionRules,
          pastContributions: sme?.pastContributions,
        });
      } catch (dbError) {
        console.warn('[API] Database update failed, falling back to in-memory store:', dbError);
        updated = updateSME(workspaceId, smeId, {
          ...sme,
          workspaceId,
        });
      }
    } else {
      updated = updateSME(workspaceId, smeId, {
        ...sme,
        workspaceId,
      });
    }

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

    if (smeRepository) {
      try {
        // Check if SME exists first
        const existing = await smeRepository.getById(workspaceId, smeId);
        if (!existing) {
          return NextResponse.json({ error: 'SME not found' }, { status: 404 });
        }
        await smeRepository.delete(workspaceId, smeId);
      } catch (dbError) {
        console.warn('[API] Database delete failed, falling back to in-memory store:', dbError);
        const deleted = deleteSME(workspaceId, smeId);
        if (!deleted) {
          return NextResponse.json({ error: 'SME not found' }, { status: 404 });
        }
      }
    } else {
      const deleted = deleteSME(workspaceId, smeId);
      if (!deleted) {
        return NextResponse.json({ error: 'SME not found' }, { status: 404 });
      }
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
