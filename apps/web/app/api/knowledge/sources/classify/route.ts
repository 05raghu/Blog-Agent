// API route: POST /api/knowledge/sources/classify
// Agent analyzes source content and suggests sensitivity classification

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@blog-agent/config';

export interface ClassificationResult {
  sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  confidence: number; // 0-1
  reasoning: string;
  canCite: boolean;
  suggestedDescription: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceTitle, sourceContent, sourceType } = body;

    if (!sourceTitle || !sourceContent) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceTitle, sourceContent' },
        { status: 400 }
      );
    }

    // Use Claude to analyze source sensitivity
    const textModel = await getTextModelProvider();

    const prompt = `You are a content classification expert. Analyze the following source and determine its sensitivity level for public citation.

Source Type: ${sourceType || 'general'}
Source Title: ${sourceTitle}
Source Content Preview: ${sourceContent.substring(0, 500)}

Classify this source into ONE of these categories:
- PUBLIC: Can be freely cited and attributed (blog posts, whitepapers, published articles)
- INTERNAL: Created for internal use only, not intended for public (internal docs, private research)
- CONFIDENTIAL: Contains sensitive business information (competitive analysis, pricing, strategies)
- RESTRICTED: Should not be used at all (legal documents, personal data, proprietary code)

Respond in JSON format:
{
  "sensitivityLevel": "public|internal|confidential|restricted",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of why this classification",
  "canCite": true/false,
  "suggestedDescription": "recommended description for safe citation"
}`;

    const response = await textModel.generateDraft({
      brief: prompt,
      outline: `Classify: ${sourceTitle}`,
      targetLength: 300,
    });

    // Parse Claude's JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse classification response');
    }

    const classification: ClassificationResult = JSON.parse(jsonMatch[0]);

    // Validate response
    if (!['public', 'internal', 'confidential', 'restricted'].includes(classification.sensitivityLevel)) {
      throw new Error('Invalid sensitivity level returned');
    }

    console.log(
      `[API] Classified source "${sourceTitle}" as ${classification.sensitivityLevel} (${Math.round(
        classification.confidence * 100
      )}% confidence)`
    );

    return NextResponse.json(classification);
  } catch (error) {
    console.error('[API] Source classification error:', error);
    return NextResponse.json(
      { error: 'Failed to classify source', message: (error as Error).message },
      { status: 500 }
    );
  }
}
