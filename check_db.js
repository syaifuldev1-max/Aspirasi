import { createClient } from '@supabase/supabase-js';

const s = createClient('https://hhbtrwrllydowupqwrku.supabase.co', 'sb_publishable_EifGfFvAIdOeXsUw8vNibQ_wI9w61LI');

async function check() {
  const { data: dprd } = await s.from('dprd_members').select('*').order('id');
  console.log('--- DPRD MEMBERS ---');
  console.log(dprd);

  const { data: users } = await s.from('users').select('id, username, role, dprd_member_id').order('id');
  console.log('--- USERS ---');
  console.log(users);
}

check();
