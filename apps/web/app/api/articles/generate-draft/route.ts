// API route: POST /api/articles/generate-draft — Generate article draft
// Uses centralized provider (OpenAI, Anthropic, or Mock) with brand guidelines

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

    const { title, brief, outline, targetAudience, briefingInsights, feedback: feedbackParam, currentContent } = await request.json();

    if (!title || !brief || !outline) {
      return NextResponse.json(
        { error: 'title, brief, and outline are required' },
        { status: 400 }
      );
    }

    // Fetch brand profile from Supabase
    const supabase = createServerClient();
    const { data: voiceProfile, error: voiceError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (voiceError && voiceError.code !== 'PGRST116') {
      console.error('[API] Error fetching brand profile:', voiceError);
    }

    // Build voice profile string from stored data if available and approved
    let voiceProfileString: string | undefined;
    if (voiceProfile && voiceProfile.approval_status === 'approved') {
      const parts: string[] = [];

      // Use structured fields if available, otherwise fall back to guidelines text
      if (voiceProfile.principles && voiceProfile.principles.length > 0) {
        parts.push(`Principles: ${voiceProfile.principles.join(', ')}`);
      }
      if (voiceProfile.desired_patterns && voiceProfile.desired_patterns.length > 0) {
        parts.push(`Desired patterns: ${voiceProfile.desired_patterns.join(', ')}`);
      }
      if (voiceProfile.prohibited_patterns && voiceProfile.prohibited_patterns.length > 0) {
        parts.push(`Avoid: ${voiceProfile.prohibited_patterns.join(', ')}`);
      }
      if (voiceProfile.tone_boundaries && voiceProfile.tone_boundaries.length > 0) {
        parts.push(`Tone: ${voiceProfile.tone_boundaries.join(', ')}`);
      }
      if (voiceProfile.terminology && Object.keys(voiceProfile.terminology).length > 0) {
        const terms = Object.entries(voiceProfile.terminology)
          .map(([term, explanation]) => `${term} (${explanation})`)
          .join(', ');
        parts.push(`Terminology: ${terms}`);
      }
      if (voiceProfile.strong_exemplars && voiceProfile.strong_exemplars.length > 0) {
        parts.push(`Good examples: ${voiceProfile.strong_exemplars.join('; ')}`);
      }
      if (voiceProfile.weak_exemplars && voiceProfile.weak_exemplars.length > 0) {
        parts.push(`Examples to avoid: ${voiceProfile.weak_exemplars.join('; ')}`);
      }

      // Fall back to guidelines text if no structured fields
      if (parts.length === 0 && voiceProfile.guidelines) {
        voiceProfileString = voiceProfile.guidelines;
      } else {
        voiceProfileString = parts.join('\n');
      }
    }

    const provider = await getTextModelProvider();
    const draft = await provider.generateDraft({
      title,
      brief,
      outline,
      targetAudience,
      targetLength: 2000,
      voiceProfile: voiceProfileString,
      briefingInsights,
      reviewerFeedback: feedbackParam,
      currentContent,
    });

    return NextResponse.json({
      success: true,
      draft,
      workspaceId: workspace.workspaceId,
      voiceProfileApplied: voiceProfile?.approval_status === 'approved',
      voiceProfile: voiceProfile?.approval_status === 'approved' ? {
        principles: voiceProfile.principles || [],
        desiredPatterns: voiceProfile.desired_patterns || [],
        prohibitedPatterns: voiceProfile.prohibited_patterns || [],
        terminology: voiceProfile.terminology || {},
        toneBoundaries: voiceProfile.tone_boundaries || [],
        strongExemplars: voiceProfile.strong_exemplars || [],
        weakExemplars: voiceProfile.weak_exemplars || [],
      } : null,
      briefingInsightsApplied: !!briefingInsights && Object.keys(briefingInsights).length > 0,
      briefingInsights: briefingInsights || null,
    });
  } catch (error) {
    console.error('[API] Generate draft error:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft', message: (error as Error).message },
      { status: 500 }
    );
  }
}
