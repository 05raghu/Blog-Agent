// API route: POST /api/knowledge/claims/extract
// Extracts claims from article content

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
    const { articleId, outline } = body;

    if (!articleId || !outline) {
      return NextResponse.json(
        { error: 'Missing required fields: articleId, outline' },
        { status: 400 }
      );
    }

    // Simple extraction: sentences that look like claims
    const claims: Array<{ id: string; text: string; type: string; status: string }> = [];
    const sentences = outline
      .split(/[.!?]+/)
      .filter((s: string) => s.trim().length > 20);

    interface ClaimInsert {
      id: string;
      workspace_id: string;
      article_id: string;
      source_id: null;
      text: string;
      type: string;
      status: string;
      flagged_for_review: boolean;
    }
    const claimsToInsert: ClaimInsert[] = [];
    sentences.slice(0, 5).forEach((sentence: string) => {
      if (sentence.includes('is') || sentence.includes('are') || sentence.includes('can')) {
        const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        claimsToInsert.push({
          id: claimId,
          workspace_id: workspace.workspaceId,
          article_id: articleId,
          source_id: null,
          text: sentence.trim(),
          type: 'factual',
          status: 'unverified',
          flagged_for_review: false,
        });
        claims.push({
          id: claimId,
          text: sentence.trim(),
          type: 'factual',
          status: 'unverified',
        });
      }
    });

    if (claimsToInsert.length > 0) {
      const supabase = createServerClient();
      const { error: insertError } = await supabase
        .from('claims')
        .insert(claimsToInsert);

      if (insertError) {
        console.error('[API] Claim insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to extract claims' },
          { status: 400 }
        );
      }
    }

    console.log(`[API] Extracted ${claims.length} claims from article ${articleId}`);

    return NextResponse.json({
      success: true,
      claimsExtracted: claims.length,
      claims,
    });
  } catch (error) {
    console.error('[API] Claim extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract claims', message: (error as Error).message },
      { status: 500 }
    );
  }
}
