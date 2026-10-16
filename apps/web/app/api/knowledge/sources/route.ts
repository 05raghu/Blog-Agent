// API route: GET/POST /api/knowledge/sources
// Fetches from Supabase, never from memory store

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const strategyId = searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: sources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('workspace_id', workspace.workspaceId);

    if (error) {
      console.error('[API] Sources fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sources' },
        { status: 500 }
      );
    }

    const mappedSources = (sources || []).map((source: any) => ({
      id: source.id,
      type: source.type,
      title: source.title,
      canonicalUrl: source.canonical_url,
      author: source.author,
      description: source.description,
      transcriptText: source.transcript_text,
      sensitivityLevel: source.sensitivity_level,
      citationPermission: source.citation_permission,
      trustTier: source.trust_tier,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    }));

    return NextResponse.json({ sources: mappedSources });
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
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

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

    const sourceId = `source_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const contentHash = Buffer.from(title + (canonicalUrl || transcriptText || description || '')).toString('hex');

    const supabase = createServerClient();
    const { error: insertError } = await supabase
      .from('sources')
      .insert({
        id: sourceId,
        workspace_id: workspace.workspaceId,
        type,
        title,
        description,
        canonical_url: canonicalUrl,
        author,
        sensitivity_level: sensitivityLevel || 'public',
        citation_permission: citationPermission || false,
        transcript_text: transcriptText,
        content_hash: contentHash,
        trust_tier: 'unreviewed',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API] Source insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create source' },
        { status: 400 }
      );
    }

    console.log(`[API] Created source ${sourceId} for workspace ${workspace.workspaceId}`);

    return NextResponse.json({
      success: true,
      source: {
        id: sourceId,
        type,
        title,
        canonicalUrl,
        author,
        description,
        transcriptText,
        sensitivityLevel: sensitivityLevel || 'public',
        citationPermission: citationPermission || false,
        trustTier: 'unreviewed',
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[API] Source creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create source', message: (error as Error).message },
      { status: 500 }
    );
  }
}
