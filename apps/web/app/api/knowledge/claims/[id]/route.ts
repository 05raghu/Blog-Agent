// API route: DELETE /api/knowledge/claims/[id]

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const { id } = params;

    const supabase = createServerClient();
    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspace.workspaceId);

    if (error) {
      console.error('[API] Claim delete error:', error);
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    console.log(`[API] Deleted claim ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Claim delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete claim', message: (error as Error).message },
      { status: 500 }
    );
  }
}
