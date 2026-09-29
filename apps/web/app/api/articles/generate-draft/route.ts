// API route: POST /api/articles/generate-draft — Generate article draft
// Uses centralized provider (OpenAI, Anthropic, or Mock) with brand guidelines

import { NextRequest, NextResponse } from 'next/server';
import { getTextModelProvider } from '@/lib/text-model';
import { getVoiceProfile } from '@/lib/brand-store';

export async function POST(request: NextRequest) {
  try {
    const { title, brief, outline, targetAudience, workspaceId = 'default-workspace' } = await request.json();

    if (!title || !brief || !outline) {
      return NextResponse.json(
        { error: 'title, brief, and outline are required' },
        { status: 400 }
      );
    }

    // Fetch voice profile (brand guidelines)
    const voiceProfile = getVoiceProfile(workspaceId);

    // Build voice profile string from stored data if available and approved
    let voiceProfileString: string | undefined;
    if (voiceProfile && voiceProfile.approved) {
      const parts: string[] = [];

      if (voiceProfile.principles.length > 0) {
        parts.push(`Principles: ${voiceProfile.principles.join(', ')}`);
      }
      if (voiceProfile.desiredPatterns.length > 0) {
        parts.push(`Desired patterns: ${voiceProfile.desiredPatterns.join(', ')}`);
      }
      if (voiceProfile.prohibitedPatterns.length > 0) {
        parts.push(`Avoid: ${voiceProfile.prohibitedPatterns.join(', ')}`);
      }
      if (voiceProfile.toneBoundaries.length > 0) {
        parts.push(`Tone: ${voiceProfile.toneBoundaries.join(', ')}`);
      }
      if (Object.keys(voiceProfile.terminology).length > 0) {
        const terms = Object.entries(voiceProfile.terminology)
          .map(([term, explanation]) => `${term} (${explanation})`)
          .join(', ');
        parts.push(`Terminology: ${terms}`);
      }
      if (voiceProfile.exemplars.strong.length > 0) {
        parts.push(`Good examples: ${voiceProfile.exemplars.strong.join('; ')}`);
      }

      voiceProfileString = parts.join('\n');
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
      voiceProfileApplied: !!voiceProfile?.approved,
      voiceProfile: voiceProfile?.approved ? {
        principles: voiceProfile.principles,
        desiredPatterns: voiceProfile.desiredPatterns,
        prohibitedPatterns: voiceProfile.prohibitedPatterns,
        terminology: voiceProfile.terminology,
        toneBoundaries: voiceProfile.toneBoundaries,
        exemplars: voiceProfile.exemplars,
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
