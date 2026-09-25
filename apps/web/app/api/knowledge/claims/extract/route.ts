// API route: POST /api/knowledge/claims/extract
// Extracts claims from article content (simple mock implementation)

import { NextRequest, NextResponse } from 'next/server';
import { claimStore, type Claim } from '../../store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, outline } = body;

    if (!articleId || !outline) {
      return NextResponse.json(
        { error: 'Missing required fields: articleId, outline' },
        { status: 400 }
      );
    }

    // Simple mock: extract sentences that look like claims
    // In production, this would use NLP or Claude API
    const claims: Claim[] = [];
    const sentences = outline
      .split(/[.!?]+/)
      .filter((s: string) => s.trim().length > 20);

    sentences.slice(0, 5).forEach((sentence: string) => {
      if (sentence.includes('is') || sentence.includes('are') || sentence.includes('can')) {
        const claimId = `claim_${crypto.randomUUID()}`;
        const claim: Claim = {
          id: claimId,
          articleId,
          sourceId: '',
          text: sentence.trim(),
          type: 'factual',
          status: 'unverified',
          flaggedForReview: false,
          createdAt: new Date(),
        };

        claimStore.set(claimId, claim);
        claims.push(claim);
      }
    });

    console.log(`[API] Extracted ${claims.length} claims from article ${articleId}`);

    return NextResponse.json({
      claimsExtracted: claims.length,
      claims: claims.map((c) => ({
        id: c.id,
        text: c.text,
        type: c.type,
        status: c.status,
      })),
    });
  } catch (error) {
    console.error('[API] Claim extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract claims', message: (error as Error).message },
      { status: 500 }
    );
  }
}
