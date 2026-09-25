// API route: POST /api/articles/[id]/link-sources — Link sources to an article

import { NextRequest, NextResponse } from 'next/server';
import { articleStore } from '../../store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;
    const { sourceIds } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(sourceIds)) {
      return NextResponse.json(
        { error: 'sourceIds must be an array' },
        { status: 400 }
      );
    }

    // Get article from store
    const article = articleStore.get(articleId);
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Update article with linked sources
    const updatedArticle = {
      ...article,
      linkedSources: sourceIds,
      updatedAt: new Date(),
    };

    articleStore.set(articleId, updatedArticle);

    console.log(`[API] Linked ${sourceIds.length} source(s) to article ${articleId}`);

    return NextResponse.json({
      success: true,
      articleId,
      linkedSourcesCount: sourceIds.length,
    });
  } catch (error) {
    console.error('[API] Link sources error:', error);
    return NextResponse.json(
      { error: 'Failed to link sources', message: (error as Error).message },
      { status: 500 }
    );
  }
}
