// Admin endpoint to setup test users with roles
// Hit this endpoint to configure raghavendra and keerthi with author/reviewer roles

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/workspace-auth';

export async function GET() {
  try {
    const supabase = createServerClient();

    console.log('🔍 Checking for test users...');

    // Get users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', ['raghavendra@codewave.com', 'keerthi@codewave.com']);

    if (usersError) {
      return NextResponse.json(
        { error: 'Error fetching users', details: usersError },
        { status: 500 }
      );
    }

    console.log('✅ Found users:', users?.length || 0);

    if (!users || users.length === 0) {
      return NextResponse.json(
        {
          status: 'pending',
          message: 'No test users found. Please sign up both accounts first.',
          instructions: [
            '1. Sign up raghavendra@codewave.com with Author role',
            '2. Sign up keerthi@codewave.com with Reviewer role',
            '3. Then call this endpoint again',
          ],
        },
        { status: 200 }
      );
    }

    // Get workspaces
    const { data: workspaces } = await supabase.from('workspaces').select('id, name');

    if (!workspaces || workspaces.length === 0) {
      return NextResponse.json(
        { error: 'No workspaces found' },
        { status: 400 }
      );
    }

    const workspaceId = workspaces[0].id;
    const raghavendra = users.find((u) => u.email === 'raghavendra@codewave.com');
    const keerthi = users.find((u) => u.email === 'keerthi@codewave.com');

    const updates = [];

    // Update/Create raghavendra as author (marketer role)
    if (raghavendra) {
      // Delete existing membership first
      await supabase
        .from('memberships')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', raghavendra.id);

      // Insert new membership
      const { error: ragError } = await supabase
        .from('memberships')
        .insert({
          workspace_id: workspaceId,
          user_id: raghavendra.id,
          role: 'marketer',
        });

      if (ragError) {
        console.error('Error updating raghavendra:', ragError);
        updates.push({
          email: 'raghavendra@codewave.com',
          role: 'marketer',
          status: 'error',
          error: ragError.message,
        });
      } else {
        updates.push({
          email: 'raghavendra@codewave.com',
          role: 'marketer (Author)',
          status: '✅ updated',
        });
      }
    }

    // Update/Create keerthi as reviewer (editor role)
    if (keerthi) {
      // Delete existing membership first
      await supabase
        .from('memberships')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', keerthi.id);

      // Insert new membership
      const { error: keerError } = await supabase
        .from('memberships')
        .insert({
          workspace_id: workspaceId,
          user_id: keerthi.id,
          role: 'editor',
        });

      if (keerError) {
        console.error('Error updating keerthi:', keerError);
        updates.push({
          email: 'keerthi@codewave.com',
          role: 'editor',
          status: 'error',
          error: keerError.message,
        });
      } else {
        updates.push({
          email: 'keerthi@codewave.com',
          role: 'editor (Reviewer)',
          status: '✅ updated',
        });
      }
    }

    return NextResponse.json({
      status: 'complete',
      message: 'Test users configured successfully!',
      workspace: workspaces[0],
      updates,
      nextSteps: [
        '1. Login as raghavendra@codewave.com',
        '2. Create or open an article',
        '3. Go to Feedback tab → Click "→ Submit for Review"',
        '4. Logout and login as keerthi@codewave.com',
        '5. See the same article and click "✅ Approve Article" or "📝 Request Changes"',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Setup failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
