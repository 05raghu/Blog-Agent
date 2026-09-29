// API route: POST /api/articles/generate-draft — Generate article draft
// Uses centralized provider (OpenAI, Anthropic, or Mock) with brand guidelines

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';
import { brandProfileStore } from '@/app/api/knowledge/brand-profile/route';

export async function POST(request: NextRequest) {
  try {
    const { title, brief, outline, targetAudience, workspaceId = 'default-workspace' } = await request.json();

    if (!title || !brief || !outline) {
      return NextResponse.json(
        { error: 'title, brief, and outline are required' },
        { status: 400 }
      );
    }

    // Fetch brand profile from knowledge endpoint (keyed by workspaceId)
    const voiceProfile = brandProfileStore.get(workspaceId);

    // Build voice profile string from stored data if available and approved
    let voiceProfileString: string | undefined;
    if (voiceProfile && voiceProfile.approvalStatus === 'approved') {
      const parts: string[] = [];

      // Use structured fields if available, otherwise fall back to guidelines text
      if (voiceProfile.principles && voiceProfile.principles.length > 0) {
        parts.push(`Principles: ${voiceProfile.principles.join(', ')}`);
      }
      if (voiceProfile.desiredPatterns && voiceProfile.desiredPatterns.length > 0) {
        parts.push(`Desired patterns: ${voiceProfile.desiredPatterns.join(', ')}`);
      }
      if (voiceProfile.prohibitedPatterns && voiceProfile.prohibitedPatterns.length > 0) {
        parts.push(`Avoid: ${voiceProfile.prohibitedPatterns.join(', ')}`);
      }
      if (voiceProfile.toneBoundaries && voiceProfile.toneBoundaries.length > 0) {
        parts.push(`Tone: ${voiceProfile.toneBoundaries.join(', ')}`);
      }
      if (voiceProfile.terminology && Object.keys(voiceProfile.terminology).length > 0) {
        const terms = Object.entries(voiceProfile.terminology)
          .map(([term, explanation]) => `${term} (${explanation})`)
          .join(', ');
        parts.push(`Terminology: ${terms}`);
      }
      if (voiceProfile.strongExemplars && voiceProfile.strongExemplars.length > 0) {
        parts.push(`Good examples: ${voiceProfile.strongExemplars.join('; ')}`);
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
    });

    return NextResponse.json({
      success: true,
      draft,
      voiceProfileApplied: voiceProfile?.approvalStatus === 'approved',
      voiceProfile: voiceProfile?.approvalStatus === 'approved' ? {
        principles: voiceProfile.principles || [],
        desiredPatterns: voiceProfile.desiredPatterns || [],
        prohibitedPatterns: voiceProfile.prohibitedPatterns || [],
        terminology: voiceProfile.terminology || {},
        toneBoundaries: voiceProfile.toneBoundaries || [],
        strongExemplars: voiceProfile.strongExemplars || [],
        weakExemplars: voiceProfile.weakExemplars || [],
      } : null,
    });
  } catch (error) {
    console.error('[API] Generate draft error:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft', message: (error as Error).message },
      { status: 500 }
    );
  }
}
