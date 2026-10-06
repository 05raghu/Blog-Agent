// API route: GET/POST /api/knowledge/sources
// Uses database with fallback to in-memory store for development

import { NextRequest, NextResponse } from 'next/server';
import { sourceStore, type Source } from '../store';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const strategyId = searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId required' }, { status: 400 });
    }

    let sources;

    if (sourceRepository) {
      try {
        const dbSources = await sourceRepository.listByWorkspace(strategyId);
        sources = dbSources.map((source: any) => ({
          id: source.id,
          type: source.type,
          title: source.title,
          canonicalUrl: source.canonicalUrl,
          author: source.author,
          description: source.description,
          transcriptText: source.transcriptText,
          sensitivityLevel: source.sensitivityLevel,
          citationPermission: source.citationPermission,
          trustTier: source.trustTier,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt,
        }));
      } catch (dbError) {
        console.warn('[API] Database query failed, falling back to in-memory store:', dbError);
        sources = Array.from(sourceStore.values())
          .filter((source) => source.workspaceId === strategyId)
          .map((source) => ({
            id: source.id,
            type: source.type,
            title: source.title,
            canonicalUrl: source.canonicalUrl,
            author: source.author,
            description: source.description,
            transcriptText: source.transcriptText,
            sensitivityLevel: source.sensitivityLevel,
            citationPermission: source.citationPermission,
            trustTier: source.trustTier,
            createdAt: source.createdAt,
            updatedAt: source.updatedAt,
          }));
      }
    } else {
      sources = Array.from(sourceStore.values())
        .filter((source) => source.workspaceId === strategyId)
        .map((source) => ({
          id: source.id,
          type: source.type,
          title: source.title,
          canonicalUrl: source.canonicalUrl,
          author: source.author,
          description: source.description,
          transcriptText: source.transcriptText,
          sensitivityLevel: source.sensitivityLevel,
          citationPermission: source.citationPermission,
          trustTier: source.trustTier,
          createdAt: source.createdAt,
          updatedAt: source.updatedAt,
        }));
    }

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
    const { strategyId, type, title, canonicalUrl, author, description, transcriptText, sensitivityLevel, citationPermission } = body;

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
    const contentHash = Buffer.from(title + (canonicalUrl || transcriptText || description || '')).toString('hex');

    const sourceData = {
      id: sourceId,
      workspaceId: strategyId,
      type: type as Source['type'],
      title,
      canonicalUrl,
      author,
      description,
      transcriptText,
      sensitivityLevel: sensitivityLevel || 'public',
      citationPermission: citationPermission || false,
      trustTier: 'unreviewed',
      createdAt: now,
      updatedAt: now,
    };

    if (sourceRepository) {
      try {
        await sourceRepository.create({
          id: sourceId,
          workspaceId: strategyId,
          type,
          title,
          description,
          canonicalUrl,
          author,
          sensitivityLevel: sensitivityLevel || 'public',
          citationPermission: citationPermission || false,
          transcriptText,
          contentHash,
          trustTier: 'unreviewed',
        });
      } catch (dbError) {
        console.warn('[API] Database insert failed, falling back to in-memory store:', dbError);
        sourceStore.set(sourceId, sourceData as Source);
      }
    } else {
      sourceStore.set(sourceId, sourceData as Source);
    }

    console.log(`[API] Created source ${sourceId} for strategy ${strategyId}`);

    return NextResponse.json({
      id: sourceId,
      title,
      type,
      sensitivityLevel: sensitivityLevel || 'public',
      citationPermission: citationPermission || false,
      trustTier: 'unreviewed',
      createdAt: now,
    });
  } catch (error) {
    console.error('[API] Source creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create source', message: (error as Error).message },
      { status: 500 }
    );
  }
}
