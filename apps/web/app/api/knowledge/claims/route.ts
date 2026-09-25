// API route: GET/POST /api/knowledge/claims

import { NextRequest, NextResponse } from 'next/server';
import { claimStore, type Claim } from '../store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get('articleId');
    const sourceId = searchParams.get('sourceId');

    if (!articleId && !sourceId) {
      return NextResponse.json({ error: 'articleId or sourceId required' }, { status: 400 });
    }

    let claims: Claim[] = [];

    if (articleId) {
      // Filter claims by article
      claims = Array.from(claimStore.values()).filter(
        (claim) => claim.articleId === articleId
      );
    } else if (sourceId) {
      // Filter claims by source
      claims = Array.from(claimStore.values()).filter(
        (claim) => claim.sourceId === sourceId
      );
    }

    return NextResponse.json({ claims });
  } catch (error) {
    console.error('[API] Claims fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, sourceId, text, type = 'factual' } = body;

    if (!articleId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: articleId, text' },
        { status: 400 }
      );
    }

    const claimId = `claim_${crypto.randomUUID()}`;
    const now = new Date();

    const claim: Claim = {
      id: claimId,
      articleId,
      sourceId: sourceId || '',
      text,
      type: type as Claim['type'],
      status: 'unverified',
      flaggedForReview: false,
      createdAt: now,
    };

    claimStore.set(claimId, claim);

    console.log(`[API] Created claim ${claimId} for article ${articleId}`);

    return NextResponse.json({
      id: claim.id,
      text: claim.text,
      type: claim.type,
      status: claim.status,
      sourceId: claim.sourceId,
    });
  } catch (error) {
    console.error('[API] Claim creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create claim', message: (error as Error).message },
      { status: 500 }
    );
  }
}
