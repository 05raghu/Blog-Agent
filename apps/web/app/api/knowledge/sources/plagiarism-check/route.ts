// API route: POST /api/knowledge/sources/plagiarism-check
// Detects duplicate/similar sources from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

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
    const { title, canonicalUrl, excludeSourceId } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    // Fetch all sources for this workspace
    const supabase = createServerClient();
    const { data: existingSources, error } = await supabase
      .from('sources')
      .select('id, title, canonical_url')
      .eq('workspace_id', workspace.workspaceId)
      .neq('id', excludeSourceId || '');

    if (error) {
      console.error('[API] Plagiarism check error:', error);
      return NextResponse.json(
        { error: 'Failed to check plagiarism' },
        { status: 500 }
      );
    }

    const duplicates = [];
    const titleLower = title.toLowerCase();

    for (const existing of existingSources || []) {
      const existingTitleLower = existing.title.toLowerCase();

      // Exact title match
      if (existingTitleLower === titleLower) {
        duplicates.push({
          sourceId: existing.id,
          sourceTitle: existing.title,
          reason: 'Exact title match',
          similarity: 1.0,
        });
        continue;
      }

      // URL match (exact)
      if (canonicalUrl && existing.canonical_url === canonicalUrl) {
        duplicates.push({
          sourceId: existing.id,
          sourceTitle: existing.title,
          reason: 'Same URL',
          similarity: 1.0,
        });
        continue;
      }

      // Partial title match (word overlap)
      const titleWords = titleLower.split(/\s+/);
      const existingWords = existingTitleLower.split(/\s+/);
      const overlap = titleWords.filter((w: string) => existingWords.includes(w)).length;
      const similarity = overlap / Math.max(titleWords.length, existingWords.length);

      if (similarity >= 0.7 || overlap >= 3) {
        duplicates.push({
          sourceId: existing.id,
          sourceTitle: existing.title,
          reason: `${Math.round(similarity * 100)}% title similarity`,
          similarity,
        });
      }
    }

    return NextResponse.json({
      isDuplicate: duplicates.length > 0,
      duplicates: duplicates.sort((a, b) => b.similarity - a.similarity),
      message: duplicates.length > 0 ? `Found ${duplicates.length} potential duplicate(s)` : 'No duplicates found',
    });
  } catch (error) {
    console.error('[API] Plagiarism check error:', error);
    return NextResponse.json(
      { error: 'Failed to check plagiarism', message: (error as Error).message },
      { status: 500 }
    );
  }
}
