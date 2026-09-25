// API route: GET/POST /api/articles — Manage articles in content calendar

import { NextRequest, NextResponse } from 'next/server';
import { articleStore } from './store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, strategyId, title, brief, outline, assignedSME } = body;

    if (!topicId || !strategyId) {
      return NextResponse.json(
        { error: 'topicId and strategyId are required' },
        { status: 400 }
      );
    }

    // Check concurrent articles limit (max 5)
    const activeArticles = Array.from(articleStore.values()).filter(
      (a) => a.strategyId === strategyId && !['CANCELLED', 'APPROVED'].includes(a.status)
    );

    if (activeArticles.length >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 concurrent articles per strategy' },
        { status: 400 }
      );
    }

    // Create article
    const articleId = `article_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // No auto-generated outline - user generates it from the brief
    const defaultOutline = outline || '';

    // Calculate word count from brief only
    const contentLength = (brief || '').length;
    const estimatedWordCount = Math.ceil(contentLength / 5); // Rough estimate: ~5 chars per word

    const article = {
      id: articleId,
      contentId: `content_${Date.now()}`, // Permanent identifier for tracking
      topicId,
      strategyId,
      title: title || 'Untitled Article',
      brief: brief || 'Brief to be determined',
      outline: defaultOutline,
      content: '', // Empty content - user fills during editing
      angle: '', // Will be set during brief editing
      targetAudience: '', // Will be set during brief editing
      status: 'NOT_STARTED',
      assignedSME: assignedSME || null,
      owner: 'system', // TODO: use actual user from auth
      plannedPublishDate: null,
      wordCount: estimatedWordCount,
      createdAt: new Date(),
      updatedAt: new Date(),
      pausedReason: null,
      blockedReason: null,
    };

    articleStore.set(articleId, article);
    console.log(`[API] Created article ${articleId}. Store now has ${articleStore.size} articles.`);

    return NextResponse.json({
      id: article.id,
      contentId: article.contentId,
      title: article.title,
      status: article.status,
      topicId: article.topicId,
      strategyId: article.strategyId,
      createdAt: article.createdAt,
    });
  } catch (error) {
    console.error('[API] Article creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create article', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const strategyId = request.nextUrl.searchParams.get('strategyId');
    const articleId = request.nextUrl.searchParams.get('id');

    if (articleId) {
      // Get single article
      const article = articleStore.get(articleId);
      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: article.id,
        contentId: article.contentId,
        title: article.title,
        brief: article.brief,
        outline: article.outline,
        content: (article as any).content || '',
        status: article.status,
        topicId: article.topicId,
        strategyId: article.strategyId,
        assignedSME: article.assignedSME,
        owner: article.owner,
        plannedPublishDate: article.plannedPublishDate,
        publishDate: (article as any).publishDate,
        wordCount: article.wordCount,
        linkedSources: (article as any).linkedSources || [],
        pausedReason: article.pausedReason,
        blockedReason: article.blockedReason,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      });
    }

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId or id is required' }, { status: 400 });
    }

    // Get all articles for strategy (max 5 concurrent)
    const articles = Array.from(articleStore.values())
      .filter((a) => a.strategyId === strategyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((a) => ({
        id: a.id,
        contentId: a.contentId,
        title: a.title,
        status: a.status,
        topicId: a.topicId,
        strategyId: a.strategyId,
        assignedSME: a.assignedSME,
        plannedPublishDate: a.plannedPublishDate,
        wordCount: a.wordCount,
        linkedSources: (a as any).linkedSources || [],
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));

    return NextResponse.json({
      strategyId,
      count: articles.length,
      articles: articles.slice(0, 5), // Max 5
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve articles', message: (error as Error).message },
      { status: 500 }
    );
  }
}
