// API route: GET/POST /api/articles/[id]/comments
// Manage feedback comments on articles

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const articleId = params.id;

    const supabase = createServerClient();
    const { data: comments, error } = await supabase
      .from('article_comments')
      .select('*')
      .eq('article_id', articleId)
      .eq('workspace_id', workspace.workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[API] Comments fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Enrich comments with user emails
    const enrichedComments = await Promise.all((comments || []).map(async (c: any) => {
      let displayAuthorId = c.author_id;

      // If author_id doesn't have pipe separator (old format), fetch from users table
      if (c.author_id && !c.author_id.includes('|')) {
        const { data: user } = await supabase
          .from('users')
          .select('email')
          .eq('id', c.author_id)
          .single();

        if (user?.email) {
          displayAuthorId = `${c.author_id}|${user.email}`;
        }
      }

      return {
        id: c.id,
        content: c.content,
        commentType: c.comment_type,
        section: c.section,
        authorId: displayAuthorId,
        parentCommentId: c.parent_comment_id,
        isResolved: c.is_resolved,
        createdAt: c.created_at,
      };
    }));

    return NextResponse.json({
      success: true,
      comments: enrichedComments,
    });
  } catch (error) {
    console.error('[API] Comments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const articleId = params.id;
    const body = await request.json();
    const {
      content,
      commentType = 'suggestion',
      section,
      parentCommentId,
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const supabase = createServerClient();

    // Store email along with user ID for easier display
    const userEmail = workspace.email || workspace.userId;

    const { data: comment, error: insertError } = await supabase
      .from('article_comments')
      .insert({
        id: commentId,
        article_id: articleId,
        workspace_id: workspace.workspaceId,
        author_id: `${workspace.userId}|${userEmail}`, // Store both ID and email
        content: content.trim(),
        comment_type: commentType,
        section: section || null,
        parent_comment_id: parentCommentId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API] Comment insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        commentType: comment.comment_type,
        section: comment.section,
        authorId: comment.author_id,
        parentCommentId: comment.parent_comment_id,
        isResolved: comment.is_resolved,
        createdAt: comment.created_at,
      },
    });
  } catch (error) {
    console.error('[API] Comment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', message: (error as Error).message },
      { status: 500 }
    );
  }
}
