// API route: GET/POST /api/knowledge/brand-profile
// Manages brand guidelines and voice profile in Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();
    const { data: profile, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile found - return null, not an error
      return NextResponse.json({
        profile: null,
        message: 'No brand profile found for this workspace',
      });
    }

    if (error) {
      console.error('[API] Brand profile fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch brand profile' },
        { status: 500 }
      );
    }

    // Map snake_case DB fields to camelCase for response
    const mappedProfile = profile ? {
      id: profile.id,
      workspaceId: profile.workspace_id,
      guidelines: profile.guidelines || '',
      strongExemplars: profile.strong_exemplars || [],
      weakExemplars: profile.weak_exemplars || [],
      principles: profile.principles || [],
      desiredPatterns: profile.desired_patterns || [],
      prohibitedPatterns: profile.prohibited_patterns || [],
      terminology: profile.terminology || {},
      toneBoundaries: profile.tone_boundaries || [],
      approvalStatus: profile.approval_status || 'pending',
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    } : null;

    return NextResponse.json({ profile: mappedProfile });
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
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      guidelines,
      strongExemplars,
      weakExemplars,
      approvalStatus,
      principles,
      desiredPatterns,
      prohibitedPatterns,
      terminology,
      toneBoundaries,
    } = body;

    const supabase = createServerClient();

    // Check if profile exists
    const { data: existing } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('workspace_id', workspace.workspaceId)
      .single();

    const profileId = existing?.id || `brand_${workspace.workspaceId}_${Date.now()}`;

    const profileData = {
      id: profileId,
      workspace_id: workspace.workspaceId,
      guidelines: guidelines || '',
      strong_exemplars: strongExemplars || [],
      weak_exemplars: weakExemplars || [],
      principles: principles || [],
      desired_patterns: desiredPatterns || [],
      prohibited_patterns: prohibitedPatterns || [],
      terminology: terminology || {},
      tone_boundaries: toneBoundaries || [],
      approval_status: approvalStatus || 'pending',
      updated_at: new Date().toISOString(),
    };

    let error;
    let result;

    if (existing) {
      // Update existing
      const response = await supabase
        .from('brand_profiles')
        .update(profileData)
        .eq('id', profileId)
        .select()
        .single();
      error = response.error;
      result = response.data;
    } else {
      // Create new
      const response = await supabase
        .from('brand_profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      error = response.error;
      result = response.data;
    }

    if (error) {
      console.error('[API] Brand profile save error:', error);
      return NextResponse.json(
        { error: 'Failed to save brand profile' },
        { status: 400 }
      );
    }

    // Map response
    const mappedProfile = {
      id: result.id,
      workspaceId: result.workspace_id,
      guidelines: result.guidelines,
      strongExemplars: result.strong_exemplars,
      weakExemplars: result.weak_exemplars,
      principles: result.principles,
      desiredPatterns: result.desired_patterns,
      prohibitedPatterns: result.prohibited_patterns,
      terminology: result.terminology,
      toneBoundaries: result.tone_boundaries,
      approvalStatus: result.approval_status,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };

    console.log(`[API] Brand profile ${approvalStatus === 'approved' ? 'approved' : 'saved'} for workspace ${workspace.workspaceId}`);

    return NextResponse.json({
      success: true,
      profile: mappedProfile,
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
