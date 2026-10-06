// API route: GET/POST /api/articles — Manage articles in content calendar
// Uses database with fallback to in-memory store for development

import { NextRequest, NextResponse } from 'next/server';
import { articleStore } from './store';
import { getSMEsByWorkspace, updateSME } from '@/lib/sme-store';
import { getWorkspaceContext } from '@/lib/workspace-auth';

// Try to load database client; it will be null if DATABASE_URL not set
let articleRepository: any = null;
try {
  if (process.env.DATABASE_URL) {
    const dbModule = require('@blog-agent/db');
    articleRepository = dbModule.articleRepository;
  }
} catch (e) {
  console.warn('[API] Database not available, using in-memory store');
}

export async function POST(request: NextRequest) {
  try {
    // Get workspace from authenticated user
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topicId, strategyId, title, brief, outline, assignedSmeId, assignedSmeName, briefingSessionId, briefingInsights } = body;
    const workspaceId = workspace.workspaceId;

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
    const contentId = `content_${Date.now()}`;

    // No auto-generated outline - user generates it from the brief
    const defaultOutline = outline || '';

    // Calculate word count from brief only
    const contentLength = (brief || '').length;
    const estimatedWordCount = Math.ceil(contentLength / 5); // Rough estimate: ~5 chars per word

    const article = {
      id: articleId,
      contentId, // Permanent identifier for tracking
      topicId,
      strategyId,
      briefingSessionId: briefingSessionId || null, // Link to SME briefing session
      title: title || 'Untitled Article',
      brief: brief || 'Brief to be determined',
      outline: defaultOutline,
      content: '', // Empty content - user fills during editing
      angle: '', // Will be set during brief editing
      targetAudience: '', // Will be set during brief editing
      status: 'NOT_STARTED',
      assignedSmeId: assignedSmeId || null,
      assignedSmeName: assignedSmeName || null,
      briefingInsights: briefingInsights || {}, // Extracted insights from briefing session
      owner: 'system', // TODO: use actual user from auth
      plannedPublishDate: null,
      wordCount: estimatedWordCount,
      createdAt: new Date(),
      updatedAt: new Date(),
      pausedReason: null,
      blockedReason: null,
    };

    if (articleRepository) {
      try {
        await articleRepository.create({
          id: articleId,
          workspaceId,
          contentId,
          topicId,
          strategyId,
          topicTitle: '',
          contentClass: 'expert_pov',
          assignedSME: assignedSmeId,
          owner: 'system',
          status: 'not_started',
          plannedPublishDate: null,
        });
      } catch (dbError) {
        console.warn('[API] Database insert failed, falling back to in-memory store:', dbError);
        articleStore.set(articleId, article);
      }
    } else {
      articleStore.set(articleId, article);
    }

    console.log(`[API] Created article ${articleId}. Store now has ${articleStore.size} articles.`);

    // Track SME contribution (increment pastContributions)
    if (assignedSmeId) {
      try {
        const smes = getSMEsByWorkspace(workspaceId);
        const sme = smes.find((s) => s.id === assignedSmeId);

        if (sme) {
          const currentCount = (sme.pastContributions?.length || 0);
          const updatedContributions = [...(sme.pastContributions || []), articleId];

          updateSME(workspaceId, assignedSmeId, {
            pastContributions: updatedContributions,
          });

          console.log(`[API] Incremented ${sme.name} contributions: ${currentCount} → ${currentCount + 1}`);
        }
      } catch (smeErr) {
        // Log but don't fail article creation if SME tracking fails
        console.error('[API] Failed to track SME contribution:', smeErr);
      }
    }

    return NextResponse.json({
      id: article.id,
      contentId: article.contentId,
      title: article.title,
      status: article.status,
      topicId: article.topicId,
      strategyId: article.strategyId,
      assignedSmeId: article.assignedSmeId,
      assignedSmeName: article.assignedSmeName,
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
    // Get workspace from authenticated user
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const strategyId = request.nextUrl.searchParams.get('strategyId');
    const articleId = request.nextUrl.searchParams.get('id');
    const workspaceId = workspace.workspaceId;

    if (articleId) {
      // Get single article
      let article;

      if (articleRepository) {
        try {
          article = await articleRepository.getById(workspaceId, articleId);
        } catch (dbError) {
          console.warn('[API] Database query failed, falling back to in-memory store:', dbError);
          article = articleStore.get(articleId);
        }
      } else {
        article = articleStore.get(articleId);
      }

      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      return NextResponse.json({
        id: article.id,
        contentId: (article as any).contentId || article.id,
        title: article.title,
        brief: (article as any).brief || '',
        outline: (article as any).outline || '',
        content: (article as any).content || '',
        status: article.status,
        topicId: (article as any).topicId || '',
        strategyId: (article as any).strategyId || '',
        briefingSessionId: (article as any).briefingSessionId || null,
        briefingInsights: (article as any).briefingInsights || {},
        assignedSME: (article as any).assignedSME,
        owner: article.owner,
        plannedPublishDate: article.plannedPublishDate,
        publishDate: (article as any).publishDate,
        wordCount: (article as any).wordCount || 0,
        linkedSources: (article as any).linkedSources || [],
        pausedReason: (article as any).pausedReason,
        blockedReason: (article as any).blockedReason,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      });
    }

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId or id is required' }, { status: 400 });
    }

    // Get all articles for strategy (max 5 concurrent)
    let articles;

    if (articleRepository) {
      try {
        const dbArticles = await articleRepository.listByStrategy(workspaceId, strategyId);
        articles = dbArticles
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((a: any) => ({
            id: a.id,
            contentId: a.contentId,
            title: a.title || '',
            status: a.status,
            topicId: a.topicId,
            strategyId: a.strategyId,
            assignedSME: a.assignedSME,
            plannedPublishDate: a.plannedPublishDate,
            wordCount: 0,
            linkedSources: [],
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          }));
      } catch (dbError) {
        console.warn('[API] Database query failed, falling back to in-memory store:', dbError);
        articles = Array.from(articleStore.values())
          .filter((a) => a.strategyId === strategyId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((a) => ({
            id: a.id,
            contentId: (a as any).contentId,
            title: a.title,
            status: a.status,
            topicId: (a as any).topicId,
            strategyId: (a as any).strategyId,
            assignedSME: (a as any).assignedSME,
            plannedPublishDate: a.plannedPublishDate,
            wordCount: (a as any).wordCount || 0,
            linkedSources: (a as any).linkedSources || [],
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          }));
      }
    } else {
      articles = Array.from(articleStore.values())
        .filter((a) => a.strategyId === strategyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((a) => ({
          id: a.id,
          contentId: (a as any).contentId,
          title: a.title,
          status: a.status,
          topicId: (a as any).topicId,
          strategyId: (a as any).strategyId,
          assignedSME: (a as any).assignedSME,
          plannedPublishDate: a.plannedPublishDate,
          wordCount: (a as any).wordCount || 0,
          linkedSources: (a as any).linkedSources || [],
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        }));
    }

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
