// API route: GET/POST /api/knowledge/brand-profile
// Manages brand guidelines and voice profile

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for brand profiles (will be replaced with DB)
declare global {
  var _brandProfileStore: Map<string, any> | undefined;
}

const brandProfileStore = global._brandProfileStore || new Map();
global._brandProfileStore = brandProfileStore;

export { brandProfileStore };

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId') || 'default-workspace';

    const profile = brandProfileStore.get(workspaceId);

    if (!profile) {
      return NextResponse.json({
        profile: null,
        message: 'No brand profile found for this workspace',
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[API] Brand profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId = 'default-workspace',
      guidelines,
      strongExemplars,
      weakExemplars,
      approvalStatus,
      // Structured voice profile fields
      principles,
      desiredPatterns,
      prohibitedPatterns,
      terminology,
      toneBoundaries,
    } = body;

    const profile = {
      id: `brand_${workspaceId}`,
      workspaceId,
      // Text-based (legacy)
      guidelines: guidelines || '',
      strongExemplars: strongExemplars || [],
      weakExemplars: weakExemplars || [],
      // Structured voice profile (new)
      principles: principles || [],
      desiredPatterns: desiredPatterns || [],
      prohibitedPatterns: prohibitedPatterns || [],
      terminology: terminology || {},
      toneBoundaries: toneBoundaries || [],
      approvalStatus: approvalStatus || 'pending', // pending | approved
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    brandProfileStore.set(workspaceId, profile);

    console.log(`[API] Brand profile ${approvalStatus === 'approved' ? 'approved' : 'saved'} for workspace ${workspaceId}`);

    return NextResponse.json({
      success: true,
      profile,
      message: approvalStatus === 'approved'
        ? 'Brand profile approved! Sources will now be scored against this profile.'
        : 'Brand profile saved (pending approval)',
    });
  } catch (error) {
    console.error('[API] Brand profile save error:', error);
    return NextResponse.json(
      { error: 'Failed to save brand profile', message: (error as Error).message },
      { status: 500 }
    );
  }
}
