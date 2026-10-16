// API route: POST /api/knowledge/sources/brand-score
// Scores source against brand profile using AI analysis of crawled content
// Fetches brand profile from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';
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
    const { sourceTitle, sourceContent, fetchedContent } = body;

    if (!sourceTitle) {
      return NextResponse.json(
        { error: 'Missing required field: sourceTitle' },
        { status: 400 }
      );
    }

    // Get brand profile from Supabase
    const supabase = createServerClient();
    const { data: brandProfile, error: profileError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[API] Error fetching brand profile:', profileError);
    }

    if (!brandProfile || brandProfile.approval_status !== 'approved') {
      return NextResponse.json({
        alignmentScore: 0,
        alignmentReason: 'Brand profile not approved',
        matchedRules: [],
        violatedRules: [],
        matchedExemplars: [],
      });
    }

    // Use fetched content if available, otherwise fall back to sourceContent
    const contentToScore = fetchedContent || sourceContent || sourceTitle;
    const guidelines = brandProfile.guidelines;

    // Use text model to analyze alignment
    const provider = await getTextModelProvider();

    const analysisPrompt = `You are a brand alignment analyst. Analyze this source against brand guidelines.

BRAND GUIDELINES:
${guidelines}

SOURCE:
Title: ${sourceTitle}
Content: ${contentToScore.substring(0, 3000)}

Respond with JSON only:
{
  "alignmentScore": 0-100,
  "alignmentLevel": "excellent|good|fair|poor",
  "matchedRules": ["rule1", "rule2"],
  "violatedRules": ["rule1"],
  "reasoning": "brief explanation"
}`;

    const response = await provider.generateDraft({
      title: 'Brand Alignment Analysis',
      brief: analysisPrompt,
      outline: 'Analyze brand alignment',
      targetLength: 500,
    });

    let analysisResult = {
      alignmentScore: 50,
      alignmentLevel: 'fair',
      matchedRules: [],
      violatedRules: [],
      reasoning: 'Could not analyze content',
    };

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse response:', e);
    }

    return NextResponse.json({
      alignmentScore: analysisResult.alignmentScore,
      alignmentPercentage: `${analysisResult.alignmentScore}%`,
      matchedRules: analysisResult.matchedRules.slice(0, 3),
      violatedRules: analysisResult.violatedRules.slice(0, 3),
      alignmentLevel: analysisResult.alignmentLevel,
      reasoning: analysisResult.reasoning,
    });
  } catch (error) {
    console.error('[API] Brand score error:', error);
    return NextResponse.json(
      { error: 'Failed to score brand alignment', message: (error as Error).message },
      { status: 500 }
    );
  }
}
