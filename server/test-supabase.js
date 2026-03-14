import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hhbtrwrllydowupqwrku.supabase.co';
const supabaseKey = 'sb_publishable_EifGfFvAIdOeXsUw8vNibQ_wI9w61LI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    console.log('Test Result:', { data, error });
  } catch(e) {
    console.error('Exception:', e);
  }
}

test();
