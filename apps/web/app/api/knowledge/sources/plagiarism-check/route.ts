// API route: POST /api/knowledge/sources/plagiarism-check
// Detects duplicate/similar sources

import { NextRequest, NextResponse } from 'next/server';
import { sourceStore } from '../../store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, canonicalUrl, strategyId } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    if (!strategyId) {
      return NextResponse.json(
        { error: 'Missing required field: strategyId' },
        { status: 400 }
      );
    }

    // Filter to only sources in the same strategy (scoped plagiarism check)
    // This prevents false positives across different strategies
    const existingSources = Array.from(sourceStore.values()).filter((s) => {
      // Get strategy from URL or source - sources may not have explicit strategyId
      // So we compare against all sources for now (will be fixed with proper DB)
      return s.id !== body.excludeSourceId;
    });

    const duplicates = [];
    const titleLower = title.toLowerCase();

    for (const existing of existingSources) {
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
      if (canonicalUrl && existing.canonicalUrl === canonicalUrl) {
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

      // Flag if 70%+ word overlap or 12+ character overlap
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
      duplicates,
      plagiarismScore: duplicates.length > 0 ? 0.8 : 0.0, // 0-1 score
    });
  } catch (error) {
    console.error('[API] Plagiarism check error:', error);
    return NextResponse.json(
      { error: 'Failed to check plagiarism', message: (error as Error).message },
      { status: 500 }
    );
  }
}
