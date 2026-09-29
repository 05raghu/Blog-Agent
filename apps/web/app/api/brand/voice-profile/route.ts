// API route: GET/POST /api/brand/voice-profile — Manage voice profile

import { NextRequest, NextResponse } from 'next/server';
import { getVoiceProfile, setVoiceProfile, synthesizeVoiceProfile, VoiceProfile } from '@/lib/brand-store';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || 'default-workspace';

    const profile = getVoiceProfile(workspaceId);

    return NextResponse.json({
      success: true,
      profile: profile || null,
      message: profile ? 'Voice profile found' : 'No voice profile found',
    });
  } catch (error) {
    console.error('[API] Voice profile retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve voice profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId = 'default-workspace',
      principles,
      desiredPatterns,
      prohibitedPatterns,
      terminology,
      toneBoundaries,
      exemplars,
      approved,
      approvedBy,
    } = body;

    if (!principles || !desiredPatterns || !prohibitedPatterns || !exemplars) {
      return NextResponse.json(
        {
          error: 'Missing required fields: principles, desiredPatterns, prohibitedPatterns, exemplars',
        },
        { status: 400 }
      );
    }

    // Synthesize voice profile
    const synthesized = synthesizeVoiceProfile(
      principles,
      desiredPatterns,
      prohibitedPatterns,
      terminology || {},
      toneBoundaries || [],
      exemplars
    );

    // Create complete profile
    const profile: VoiceProfile = {
      id: `voice_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      workspaceId,
      ...synthesized,
      approved: approved === true, // Explicitly check for true
      approvedBy: approved ? approvedBy || 'system' : undefined,
      approvedAt: approved ? new Date().toISOString() : undefined,
    };

    // Save to store
    const saved = setVoiceProfile(workspaceId, profile);

    return NextResponse.json({
      success: true,
      profile: saved,
      message: 'Voice profile created successfully',
    });
  } catch (error) {
    console.error('[API] Voice profile creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create voice profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}
