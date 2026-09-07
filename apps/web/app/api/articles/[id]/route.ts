// API route: PATCH /api/articles/[id] — Update article status and metadata

import { NextRequest, NextResponse } from 'next/server';
import { validateTransition, type ArticleStage } from '@blog-agent/domain';

// Reference to the same store (in production, this would be DB)
const articleStore = new Map<string, any>();

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, plannedPublishDate, assignedSME, pausedReason, blockedReason } = body;

    const article = articleStore.get(id);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Validate status transition if status is being updated
    if (status && status !== article.status) {
      const validation = validateTransition(article.status as ArticleStage, status as ArticleStage);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    // Update article
    if (status) article.status = status;
    if (plannedPublishDate !== undefined) article.plannedPublishDate = plannedPublishDate;
    if (assignedSME !== undefined) article.assignedSME = assignedSME;
    if (pausedReason !== undefined) article.pausedReason = pausedReason;
    if (blockedReason !== undefined) article.blockedReason = blockedReason;
    article.updatedAt = new Date();

    articleStore.set(id, article);

    // Log audit event (TODO: save to audit_events table)
    console.log(`[API] Article ${id} transitioned to ${status}`);

    return NextResponse.json({
      id: article.id,
      contentId: article.contentId,
      title: article.title,
      status: article.status,
      plannedPublishDate: article.plannedPublishDate,
      assignedSME: article.assignedSME,
      updatedAt: article.updatedAt,
    });
  } catch (error) {
    console.error('[API] Article update error:', error);
    return NextResponse.json(
      { error: 'Failed to update article', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const article = articleStore.get(id);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: article.id,
      contentId: article.contentId,
      title: article.title,
      brief: article.brief,
      outline: article.outline,
      status: article.status,
      topicId: article.topicId,
      strategyId: article.strategyId,
      assignedSME: article.assignedSME,
      owner: article.owner,
      plannedPublishDate: article.plannedPublishDate,
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
