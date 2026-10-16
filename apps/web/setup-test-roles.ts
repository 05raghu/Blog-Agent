import { createServerClient } from '@/lib/workspace-auth';

async function setupTestUsers() {
  try {
    console.log('🔍 Checking for existing users...\n');
    
    const supabase = createServerClient();
    
    // Get users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', ['raghavendra@codewave.com', 'keerthi@codewave.com']);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('👥 Found users:');
    users?.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));
    
    if (!users || users.length === 0) {
      console.log('\n❌ No users found. You need to sign up both accounts first.');
      return;
    }
    
    // Get workspaces
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name');
    
    console.log('\n🏢 Workspaces:');
    workspaces?.forEach(w => console.log(`  - ${w.name} (ID: ${w.id})`));
    
    // Update memberships
    console.log('\n📝 Updating roles...');
    
    const raghavendra = users.find(u => u.email === 'raghavendra@codewave.com');
    const keerthi = users.find(u => u.email === 'keerthi@codewave.com');
    
    if (raghavendra && workspaces && workspaces.length > 0) {
      const { error: ragError } = await supabase
        .from('memberships')
        .upsert({
          workspace_id: workspaces[0].id,
          user_id: raghavendra.id,
          role: 'marketer'
        }, { onConflict: 'workspace_id,user_id' });
      
      if (ragError) {
        console.error('❌ Error updating raghavendra:', ragError);
      } else {
        console.log('  ✅ raghavendra@codewave.com → marketer (Author)');
      }
    }
    
    if (keerthi && workspaces && workspaces.length > 0) {
      const { error: keerError } = await supabase
        .from('memberships')
        .upsert({
          workspace_id: workspaces[0].id,
          user_id: keerthi.id,
          role: 'editor'
        }, { onConflict: 'workspace_id,user_id' });
      
      if (keerError) {
        console.error('❌ Error updating keerthi:', keerError);
      } else {
        console.log('  ✅ keerthi@codewave.com → editor (Reviewer)');
      }
    }
    
    console.log('\n✅ Setup complete! Ready to test.');
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

setupTestUsers();
