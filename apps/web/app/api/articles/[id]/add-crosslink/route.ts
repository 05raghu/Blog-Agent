// API route: POST /api/articles/[id]/add-crosslink — Add internal link to article
// Fetches from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetArticleId, targetTitle, anchorText } = body;

    if (!targetArticleId || !anchorText) {
      return NextResponse.json(
        { error: 'targetArticleId and anchorText are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch current article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Verify target article exists
    const { data: targetArticle, error: targetError } = await supabase
      .from('articles')
      .select('id')
      .eq('id', targetArticleId)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (targetError || !targetArticle) {
      return NextResponse.json({ error: 'Target article not found' }, { status: 404 });
    }

    // Insert link at end of article (before any image prompts section)
    let content = article.content || '';

    // Check if link already exists
    if (content.includes(`[${anchorText}]`) && content.includes(targetArticleId)) {
      return NextResponse.json({
        success: true,
        message: 'Link already exists in article',
        content,
      });
    }

    // Find insertion point (before Image Prompts section if it exists)
    const imageSectionIndex = content.indexOf('---\n\n**Image Prompts');
    const insertionPoint = imageSectionIndex > -1 ? imageSectionIndex : content.length;

    // Create link markdown
    const link = `[${anchorText}](/articles/${targetArticleId})`;

    // Insert link in a contextual way (add after the last paragraph/section before images)
    if (insertionPoint > 0) {
      // Find the last paragraph before the insertion point
      const contentBefore = content.substring(0, insertionPoint);
      const lastParagraphEnd = contentBefore.lastIndexOf('\n\n');

      if (lastParagraphEnd > -1) {
        // Insert after last paragraph
        content =
          contentBefore.substring(0, lastParagraphEnd + 2) +
          `\n**Related:** ${link}\n` +
          contentBefore.substring(lastParagraphEnd + 2) +
          content.substring(insertionPoint);
      } else {
        // Insert at beginning
        content = `${link}\n\n${content}`;
      }
    } else {
      // Append to end
      content = content ? `${content}\n\n**Related:** ${link}` : link;
    }

    // Update article in Supabase
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('workspace_id', workspace.workspaceId);

    if (updateError) {
      console.error('[API] Add crosslink error:', updateError);
      return NextResponse.json(
        { error: 'Failed to add link' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      content,
      message: `Link to "${targetTitle}" added successfully`,
    });
  } catch (error) {
    console.error('[API] Add crosslink error:', error);
    return NextResponse.json(
      { error: 'Failed to add link', message: (error as Error).message },
      { status: 500 }
    );
  }
}
