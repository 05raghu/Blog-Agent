// API route: GET/POST /api/knowledge/sources

import { NextRequest, NextResponse } from 'next/server';
import { sourceStore, type Source } from '../store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const strategyId = searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId required' }, { status: 400 });
    }

    // Filter sources by workspace (using strategyId as proxy for now)
    const sources = Array.from(sourceStore.values()).filter(
      (source) => source.workspaceId === strategyId
    );

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('[API] Sources fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategyId, type, title, canonicalUrl, author, description, transcriptText } = body;

    if (!strategyId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: strategyId, type, title' },
        { status: 400 }
      );
    }

    // Type-specific validation
    if (type === 'url' && !canonicalUrl) {
      return NextResponse.json(
        { error: 'URL type requires canonicalUrl field' },
        { status: 400 }
      );
    }

    if (type === 'transcript' && !transcriptText) {
      return NextResponse.json(
        { error: 'Transcript type requires transcriptText field' },
        { status: 400 }
      );
    }

    if (type === 'case_study' && !description) {
      return NextResponse.json(
        { error: 'Case Study type requires description field' },
        { status: 400 }
      );
    }

    if (type === 'document' && !description) {
      return NextResponse.json(
        { error: 'Document type requires description/content field' },
        { status: 400 }
      );
    }

    const sourceId = `source_${crypto.randomUUID()}`;
    const now = new Date();

    const source: Source = {
      id: sourceId,
      workspaceId: strategyId,
      type: type as Source['type'],
      title,
      canonicalUrl,
      author,
      description,
      transcriptText,
      trustTier: 'unreviewed',
      citationPermission: false,
      createdAt: now,
      updatedAt: now,
    };

    sourceStore.set(sourceId, source);

    console.log(`[API] Created source ${sourceId} for strategy ${strategyId}`);

    return NextResponse.json({
      id: source.id,
      title: source.title,
      type: source.type,
      trustTier: source.trustTier,
      createdAt: source.createdAt,
    });
  } catch (error) {
    console.error('[API] Source creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create source', message: (error as Error).message },
      { status: 500 }
    );
  }
}
