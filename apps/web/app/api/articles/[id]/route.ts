// API route: GET/PUT /api/articles/[id] — Get or update a specific article

import { NextRequest, NextResponse } from 'next/server';
import { articleStore } from '../store';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const article = articleStore.get(id);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const seoData = (article as any).seoAnalysis;
    const seoScore = (article as any).seoScore;

    return NextResponse.json({
      id: article.id,
      contentId: article.contentId,
      title: article.title,
      brief: article.brief,
      outline: article.outline,
      content: article.content || '',
      status: article.status,
      topicId: article.topicId,
      strategyId: article.strategyId,
      angle: article.angle,
      targetAudience: article.targetAudience,
      assignedSME: article.assignedSME,
      owner: article.owner,
      plannedPublishDate: article.plannedPublishDate,
      linkedSources: (article as any).linkedSources || [],
      seoScore: seoScore || null,
      seoAnalysis: seoData || null,
      wordCount: article.wordCount,
      pausedReason: article.pausedReason,
      blockedReason: article.blockedReason,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve article', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();

    const article = articleStore.get(id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Update fields
    const updated = {
      ...article,
      ...body,
      updatedAt: new Date(),
    };

    // Recalculate word count if content changed
    if (body.content) {
      const words = body.content.split(/\s+/).filter((w: string) => w.length > 0);
      updated.wordCount = words.length;
    }

    articleStore.set(id, updated);

    const seoDataUpdated = (updated as any).seoAnalysis;
    const seoScoreUpdated = (updated as any).seoScore;

    return NextResponse.json({
      id: updated.id,
      contentId: updated.contentId,
      title: updated.title,
      brief: updated.brief,
      outline: updated.outline,
      content: updated.content || '',
      status: updated.status,
      topicId: updated.topicId,
      strategyId: updated.strategyId,
      angle: updated.angle,
      targetAudience: updated.targetAudience,
      assignedSME: updated.assignedSME,
      owner: updated.owner,
      plannedPublishDate: updated.plannedPublishDate,
      linkedSources: (updated as any).linkedSources || [],
      seoScore: seoScoreUpdated || null,
      seoAnalysis: seoDataUpdated || null,
      wordCount: updated.wordCount,
      pausedReason: updated.pausedReason,
      blockedReason: updated.blockedReason,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('[API] Article update error:', error);
    return NextResponse.json(
      { error: 'Failed to update article', message: (error as Error).message },
      { status: 500 }
    );
  }
}
