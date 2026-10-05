// API route: GET/PATCH/DELETE /api/knowledge/sources/[id]
// Retrieve, update, or delete a source
// Uses database with fallback to in-memory store for development

import { NextRequest, NextResponse } from 'next/server';
import { sourceStore } from '../../store';

// Try to load database client; it will be null if DATABASE_URL not set
let sourceRepository: any = null;
try {
  if (process.env.DATABASE_URL) {
    const dbModule = require('@blog-agent/db');
    sourceRepository = dbModule.sourceRepository;
  }
} catch (e) {
  console.warn('[API] Database not available, using in-memory store');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sourceId = params.id;
    const strategyId = request.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId required' }, { status: 400 });
    }

    let source;

    if (sourceRepository) {
      try {
        source = await sourceRepository.getById(strategyId, sourceId);
      } catch (dbError) {
        console.warn('[API] Database query failed, falling back to in-memory store:', dbError);
        source = sourceStore.get(sourceId);
      }
    } else {
      source = sourceStore.get(sourceId);
    }

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(source);
  } catch (error) {
    console.error('[API] Source fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch source', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sourceId = params.id;
    const strategyId = request.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId required' }, { status: 400 });
    }

    const updates = await request.json();

    let updated;

    if (sourceRepository) {
      try {
        updated = await sourceRepository.update(strategyId, sourceId, updates);
      } catch (dbError) {
        console.warn('[API] Database update failed, falling back to in-memory store:', dbError);
        const existing = sourceStore.get(sourceId) || { id: sourceId };
        updated = {
          ...existing,
          ...updates,
          id: sourceId,
          updatedAt: new Date(),
        };
        sourceStore.set(sourceId, updated);
      }
    } else {
      const existing = sourceStore.get(sourceId) || { id: sourceId };
      updated = {
        ...existing,
        ...updates,
        id: sourceId,
        updatedAt: new Date(),
      };
      sourceStore.set(sourceId, updated);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API] Source update error:', error);
    return NextResponse.json(
      { error: 'Failed to update source', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sourceId = params.id;
    const strategyId = request.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId required' }, { status: 400 });
    }

    if (sourceRepository) {
      try {
        await sourceRepository.delete(strategyId, sourceId);
      } catch (dbError) {
        console.warn('[API] Database delete failed, falling back to in-memory store:', dbError);
        sourceStore.delete(sourceId);
      }
    } else {
      sourceStore.delete(sourceId);
    }

    return NextResponse.json(
      { success: true, message: 'Source deleted' }
    );
  } catch (error) {
    console.error('[API] Source delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete source', message: (error as Error).message },
      { status: 500 }
    );
  }
}
