const supabaseUrl = 'https://hhbtrwrllydowupqwrku.supabase.co';
const supabaseKey = 'sb_publishable_EifGfFvAIdOeXsUw8vNibQ_wI9w61LI';

async function check() {
  try {
    const resDprd = await fetch(`${supabaseUrl}/rest/v1/dprd_members?select=*`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    console.log('--- DPRD MEMBERS ---');
    console.log(await resDprd.json());

    const resUsers = await fetch(`${supabaseUrl}/rest/v1/users?select=id,username,role,dprd_member_id`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    console.log('--- USERS ---');
    console.log(await resUsers.json());
  } catch (err) {
    console.log(err);
  }
}

check();
