import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbadcpbidwxtxaqobzpm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiYWRjcGJpZHd4dHhhcW9ienBtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc2MDE2NSwiZXhwIjoyMTA2MzM2MTY1fQ.KQAjRuJxzCgYGV-qlPXzyYbLk8yRmL4Dqj902eSvlBU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupUsers() {
  console.log('📊 Checking current setup...\n');
  
  // Get users
  const { data: users } = await supabase.from('users').select('*');
  console.log('👥 Users:');
  if (users?.length > 0) {
    users.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));
  } else {
    console.log('  (none)');
  }
  
  // Get workspaces
  const { data: workspaces } = await supabase.from('workspaces').select('*');
  console.log('\n🏢 Workspaces:');
  if (workspaces?.length > 0) {
    workspaces.forEach(w => console.log(`  - ${w.name} (ID: ${w.id})`));
  } else {
    console.log('  (none)');
  }
  
  // Get memberships
  const { data: memberships } = await supabase.from('memberships').select('*');
  console.log('\n📋 Memberships:');
  if (memberships?.length > 0) {
    memberships.forEach(m => {
      const user = users?.find(u => u.id === m.user_id);
      const ws = workspaces?.find(w => w.id === m.workspace_id);
      console.log(`  - ${user?.email || m.user_id} → ${ws?.name || m.workspace_id} (role: ${m.role})`);
    });
  } else {
    console.log('  (none)');
  }
  
  console.log('\n✅ Setup complete!');
}

setupUsers().catch(console.error);
