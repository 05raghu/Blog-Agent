// API route: GET/POST /api/articles — Manage articles in content calendar
// Fetches from database, never from memory store

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
    const { topicId, strategyId, title, brief, outline, assignedSmeId, assignedSmeName, briefingSessionId, briefingInsights } = body;

    if (!topicId || !strategyId) {
      return NextResponse.json(
        { error: 'topicId and strategyId are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check concurrent articles limit (max 5)
    const { data: activeArticles, error: countError } = await supabase
      .from('articles')
      .select('id')
      .eq('workspace_id', workspace.workspaceId)
      .eq('strategy_id', strategyId)
      .not('status', 'in', '(CANCELLED,APPROVED)');

    if (countError) {
      console.error('[API] Failed to count active articles:', countError);
      return NextResponse.json(
        { error: 'Failed to check concurrent articles' },
        { status: 500 }
      );
    }

    if ((activeArticles?.length || 0) >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 concurrent articles per strategy' },
        { status: 400 }
      );
    }

    // Create article
    const articleId = `article_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const contentId = `content_${Date.now()}`;

    const { error: insertError } = await supabase
      .from('articles')
      .insert({
        id: articleId,
        workspace_id: workspace.workspaceId,
        content_id: contentId,
        topic_id: topicId,
        strategy_id: strategyId,
        topic_title: '',
        content_class: 'expert_pov',
        assigned_sme: assignedSmeId,
        owner: 'system',
        status: 'not_started',
        planned_publish_date: null,
        briefing_session_id: briefingSessionId || null,
        briefing_insights: briefingInsights || {},
        title: title || 'Untitled Article',
        brief: brief || '',
        outline: outline || '',
        content: '',
        angle: '',
        target_audience: '',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API] Article insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create article' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: articleId,
      contentId: contentId,
      title: title || 'Untitled Article',
      status: 'not_started',
      topicId: topicId,
      strategyId: strategyId,
      assignedSmeId: assignedSmeId,
      assignedSmeName: assignedSmeName,
      createdAt: new Date(),
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
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const strategyId = request.nextUrl.searchParams.get('strategyId');
    const articleId = request.nextUrl.searchParams.get('id');

    const supabase = createServerClient();

    if (articleId) {
      // Get single article
      const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .eq('workspace_id', workspace.workspaceId)
        .single();

      if (error || !article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }

      console.log('[API] Single article response data:', {
        id: article.id,
        hasBriefingSessionId: !!article.briefing_session_id,
        hasBriefingInsights: !!article.briefing_insights,
        briefingSessionId: article.briefing_session_id || null,
        briefingInsights: article.briefing_insights || {},
      });

      // Convert snake_case status to UPPER_CASE for component
      const statusMap: Record<string, string> = {
        'not_started': 'NOT_STARTED',
        'queued': 'QUEUED',
        'working': 'WORKING',
        'ready_for_review': 'READY_FOR_REVIEW',
        'approved': 'APPROVED',
        'changes_requested': 'CHANGES_REQUESTED',
        'blocked': 'BLOCKED',
        'paused': 'PAUSED',
        'cancelled': 'CANCELLED',
      };

      const normalizedStatus = statusMap[article.status?.toLowerCase() || ''] || 'NOT_STARTED';

      return NextResponse.json({
        id: article.id,
        contentId: article.content_id,
        title: article.title,
        brief: article.brief || '',
        outline: article.outline || '',
        content: article.content || '',
        status: normalizedStatus,
        topicId: article.topic_id,
        strategyId: article.strategy_id,
        briefingSessionId: article.briefing_session_id || null,
        briefingInsights: article.briefing_insights || {},
        assignedSME: article.assigned_sme,
        owner: article.owner,
        plannedPublishDate: article.planned_publish_date,
        publishDate: article.publish_date,
        wordCount: article.word_count || 0,
        linkedSources: article.linked_sources || [],
        pausedReason: article.paused_reason,
        blockedReason: article.blocked_reason,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
      });
    }

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId or id is required' }, { status: 400 });
    }

    // Get all articles for strategy (max 5 concurrent)
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('workspace_id', workspace.workspaceId)
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('[API] Articles fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    // Convert snake_case status to UPPER_CASE for component
    const statusMap: Record<string, string> = {
      'not_started': 'NOT_STARTED',
      'queued': 'QUEUED',
      'working': 'WORKING',
      'ready_for_review': 'READY_FOR_REVIEW',
      'approved': 'APPROVED',
      'changes_requested': 'CHANGES_REQUESTED',
      'blocked': 'BLOCKED',
      'paused': 'PAUSED',
      'cancelled': 'CANCELLED',
    };

    return NextResponse.json({
      strategyId,
      count: articles?.length || 0,
      articles: (articles || []).map((a: any) => ({
        id: a.id,
        contentId: a.content_id,
        title: a.title || '',
        status: statusMap[a.status?.toLowerCase() || ''] || 'NOT_STARTED',
        topicId: a.topic_id,
        strategyId: a.strategy_id,
        assignedSmeId: a.assigned_sme,
        assignedSME: a.assigned_sme,
        briefingSessionId: a.briefing_session_id || null,
        briefingInsights: a.briefing_insights || {},
        plannedPublishDate: a.planned_publish_date,
        wordCount: a.word_count || 0,
        linkedSources: a.linked_sources || [],
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
    });
  } catch (error) {
    console.error('[API] Articles retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve articles', message: (error as Error).message },
      { status: 500 }
    );
  }
}
