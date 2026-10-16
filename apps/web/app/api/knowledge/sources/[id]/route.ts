// API route: GET/PATCH/DELETE /api/knowledge/sources/[id]
// Retrieve, update, or delete a source from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const sourceId = params.id;

    const supabase = createServerClient();
    const { data: source, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', sourceId)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (error || !source) {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: source.id,
      type: source.type,
      title: source.title,
      canonicalUrl: source.canonical_url,
      author: source.author,
      description: source.description,
      transcriptText: source.transcript_text,
      sensitivityLevel: source.sensitivity_level,
      citationPermission: source.citation_permission,
      trustTier: source.trust_tier,
      brandAlignmentScore: source.brand_alignment_score,
      brandAlignmentLevel: source.brand_alignment_level,
      brandMatchedRules: source.brand_matched_rules,
      brandViolatedRules: source.brand_violated_rules,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    });
  } catch (error) {
    console.error('[API] Source fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch source', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const sourceId = params.id;
    const body = await request.json();

    // Map camelCase to snake_case
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.canonicalUrl !== undefined) updateData.canonical_url = body.canonicalUrl;
    if (body.author !== undefined) updateData.author = body.author;
    if (body.sensitivityLevel !== undefined) updateData.sensitivity_level = body.sensitivityLevel;
    if (body.citationPermission !== undefined) updateData.citation_permission = body.citationPermission;
    if (body.trustTier !== undefined) updateData.trust_tier = body.trustTier;
    if (body.transcriptText !== undefined) updateData.transcript_text = body.transcriptText;
    if (body.brandAlignmentScore !== undefined) updateData.brand_alignment_score = body.brandAlignmentScore;
    if (body.brandAlignmentLevel !== undefined) updateData.brand_alignment_level = body.brandAlignmentLevel;
    if (body.brandMatchedRules !== undefined) updateData.brand_matched_rules = body.brandMatchedRules;
    if (body.brandViolatedRules !== undefined) updateData.brand_violated_rules = body.brandViolatedRules;

    updateData.updated_at = new Date().toISOString();

    const supabase = createServerClient();
    const { data: updated, error } = await supabase
      .from('sources')
      .update(updateData)
      .eq('id', sourceId)
      .eq('workspace_id', workspace.workspaceId)
      .select()
      .single();

    if (error || !updated) {
      console.error('[API] Source update error:', error);
      return NextResponse.json(
        { error: 'Failed to update source' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      type: updated.type,
      title: updated.title,
      canonicalUrl: updated.canonical_url,
      author: updated.author,
      description: updated.description,
      transcriptText: updated.transcript_text,
      sensitivityLevel: updated.sensitivity_level,
      citationPermission: updated.citation_permission,
      trustTier: updated.trust_tier,
      brandAlignmentScore: updated.brand_alignment_score,
      brandAlignmentLevel: updated.brand_alignment_level,
      brandMatchedRules: updated.brand_matched_rules,
      brandViolatedRules: updated.brand_violated_rules,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    console.error('[API] Source update error:', error);
    return NextResponse.json(
      { error: 'Failed to update source', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const sourceId = params.id;

    const supabase = createServerClient();
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', sourceId)
      .eq('workspace_id', workspace.workspaceId);

    if (error) {
      console.error('[API] Source delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete source' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Source deleted' }
    );
  } catch (error) {
    console.error('[API] Source delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete source', message: (error as Error).message },
      { status: 500 }
    );
  }
}
