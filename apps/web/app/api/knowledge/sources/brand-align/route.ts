// API route: POST /api/knowledge/sources/brand-align
// Scores source against brand guidelines

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceTitle, sourceContent, brandGuidelines } = body;

    if (!sourceTitle || !brandGuidelines) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceTitle, brandGuidelines' },
        { status: 400 }
      );
    }

    // Mock implementation: score based on keyword matching
    // In production, this would use Claude API to analyze semantic alignment
    const content = (sourceTitle + ' ' + (sourceContent || '')).toLowerCase();

    // Simple heuristic scoring
    let score = 50; // Base score

    // Boost if content aligns with brand keywords
    const brandKeywords = [
      'transparent',
      'customer-first',
      'innovation',
      'actionable',
      'genuine',
      'authentic',
    ];
    const blockedKeywords = [
      'casino',
      'cryptocurrency',
      'spam',
      'controversial',
      'inflammatory',
    ];

    // Check for positive keywords
    let positiveMatches = 0;
    for (const keyword of brandKeywords) {
      if (content.includes(keyword)) positiveMatches++;
    }
    score += positiveMatches * 8;

    // Check for blocked keywords
    let blockedMatches = 0;
    for (const keyword of blockedKeywords) {
      if (content.includes(keyword)) blockedMatches++;
    }
    score -= blockedMatches * 20;

    // Clamp score 0-100
    score = Math.max(0, Math.min(100, score));

    const alignment = score / 100;
    const violatedRules = [];

    // Identify violated rules
    if (content.includes('casino') || content.includes('cryptocurrency')) {
      violatedRules.push('Prohibited: Gambling/crypto content not aligned with brand values');
    }
    if (content.includes('spam') || content.includes('clickbait')) {
      violatedRules.push('Prohibited: Spammy or low-quality content');
    }

    return NextResponse.json({
      alignment,
      score,
      violatedRules,
    });
  } catch (error) {
    console.error('[API] Brand alignment error:', error);
    return NextResponse.json(
      { error: 'Failed to score brand alignment', message: (error as Error).message },
      { status: 500 }
    );
  }
}
