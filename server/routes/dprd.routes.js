import { Router } from 'express';
import { supabase } from '../database/init.js';
import * as res from '../utils/response.js';

const router = Router();

// GET /api/dprd-members (public, for login dropdown)
router.get('/', async (req, reply) => {
  try {
    const { data: members, error } = await supabase
      .from('dprd_members')
      .select('id, name, party, phone')
      .eq('is_active', 1)
      .order('id', { ascending: true });
      
    if (error) throw error;
    
    return res.success(reply, members);
  } catch (error) {
    console.error('Error fetching DPRD members:', error);
    return res.error(reply, 500, 'SERVER_ERROR', 'Gagal mengambil data Anggota DPRD.', {
      debug: error?.message || String(error),
      code: error?.code,
      hint: error?.hint
    });
  }
});

export default router;
