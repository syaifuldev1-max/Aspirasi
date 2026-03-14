import { Router } from 'express';
import { supabase } from '../database/init.js';
import { authMiddleware, dprdFilter } from '../middleware/auth.js';
import * as res from '../utils/response.js';

const router = Router();

// Helper to fetch aspirasi based on filters
async function fetchAspirasi(fiscalYear, dprdMemberId) {
  let query = supabase.from('aspirasi').select('*').eq('fiscal_year', fiscalYear);
  if (dprdMemberId) {
    query = query.eq('dprd_member_id', dprdMemberId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// GET /api/dashboard/summary
router.get('/summary', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
    const aspirasiList = await fetchAspirasi(fiscalYear, req.dprdMemberId);

    const summary = {
      totalAspirasi: aspirasiList.length,
      totalBudget: aspirasiList.reduce((sum, a) => sum + Number(a.budget_amount), 0),
      penetapanCount: aspirasiList.filter(a => a.type === 'penetapan').length,
      perubahanCount: aspirasiList.filter(a => a.type === 'perubahan').length,
      fiscalYear: fiscalYear
    };

    if (req.user.role === 'superadmin' && !req.dprdMemberId) {
      // Fetch all members
      const { data: members, error } = await supabase.from('dprd_members').select('id, name').eq('is_active', 1);
      if (error) throw error;

      const byDprdMap = new Map(members.map(m => [m.id, {
        dprdId: m.id, name: m.name, count: 0, budget: 0, penetapanCount: 0, perubahanCount: 0
      }]));

      aspirasiList.forEach(a => {
        const dprd = byDprdMap.get(a.dprd_member_id);
        if (dprd) {
          dprd.count++;
          dprd.budget += Number(a.budget_amount);
          if (a.type === 'penetapan') dprd.penetapanCount++;
          if (a.type === 'perubahan') dprd.perubahanCount++;
        }
      });

      // Convert to array and sort by budget DESC
      summary.byDprd = Array.from(byDprdMap.values()).sort((a, b) => b.budget - a.budget);
    }

    return res.success(reply, summary);
  } catch (err) {
    console.error('Summary error:', err);
    return res.error(reply, 500, 'Gagal mengambil data dashboard');
  }
});

// GET /api/dashboard/chart/monthly
router.get('/chart/monthly', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
    const aspirasiList = await fetchAspirasi(fiscalYear, req.dprdMemberId);

    const allMonths = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1, count: 0, budget: 0
    }));

    aspirasiList.forEach(a => {
      // created_at is an ISO string like '2026-03-08T...'
      const date = new Date(a.created_at);
      const monthIndex = date.getMonth(); // 0-11
      allMonths[monthIndex].count++;
      allMonths[monthIndex].budget += Number(a.budget_amount);
    });

    return res.success(reply, allMonths);
  } catch (err) {
    console.error('Chart monthly error:', err);
    return res.error(reply, 500, 'Gagal mengambil chart');
  }
});

// GET /api/dashboard/chart/comparison
router.get('/chart/comparison', authMiddleware, dprdFilter, async (req, reply) => {
  try {
    const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
    const aspirasiList = await fetchAspirasi(fiscalYear, req.dprdMemberId);

    const penetapan = { type: 'penetapan', count: 0, budget: 0 };
    const perubahan = { type: 'perubahan', count: 0, budget: 0 };

    aspirasiList.forEach(a => {
      if (a.type === 'penetapan') {
        penetapan.count++;
        penetapan.budget += Number(a.budget_amount);
      } else if (a.type === 'perubahan') {
        perubahan.count++;
        perubahan.budget += Number(a.budget_amount);
      }
    });

    return res.success(reply, [penetapan, perubahan]);
  } catch (err) {
    console.error('Chart comparison error:', err);
    return res.error(reply, 500, 'Gagal mengambil chart');
  }
});

// GET /api/dashboard/chart/by-dprd
router.get('/chart/by-dprd', authMiddleware, async (req, reply) => {
  try {
    const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
    const aspirasiList = await fetchAspirasi(fiscalYear, null); // all members for this year

    const { data: members, error } = await supabase.from('dprd_members').select('id, name').eq('is_active', 1);
    if (error) throw error;

    const byDprdMap = new Map(members.map(m => [m.id, {
      id: m.id, name: m.name, count: 0, budget: 0
    }]));

    aspirasiList.forEach(a => {
      const dprd = byDprdMap.get(a.dprd_member_id);
      if (dprd) {
        dprd.count++;
        dprd.budget += Number(a.budget_amount);
      }
    });

    const data = Array.from(byDprdMap.values()).sort((a, b) => b.budget - a.budget);
    return res.success(reply, data);
  } catch (err) {
    console.error('Chart by-dprd error:', err);
    return res.error(reply, 500, 'Gagal mengambil chart');
  }
});

export default router;
