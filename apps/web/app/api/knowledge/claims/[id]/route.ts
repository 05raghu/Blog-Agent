// API route: DELETE /api/knowledge/claims/[id]

import { NextRequest, NextResponse } from 'next/server';
import { claimStore } from '../../store';

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!claimStore.has(id)) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    claimStore.delete(id);

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
