import { Router } from 'express';
import { queryAll, queryOne } from '../database/init.js';
import { authMiddleware, dprdFilter } from '../middleware/auth.js';
import * as res from '../utils/response.js';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', authMiddleware, dprdFilter, (req, reply) => {
  const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
  let where = 'WHERE a.fiscal_year = ?';
  const params = [fiscalYear];

  if (req.dprdMemberId) { where += ' AND a.dprd_member_id = ?'; params.push(req.dprdMemberId); }

  const summary = queryOne(`
    SELECT COUNT(*) as totalAspirasi,
      COALESCE(SUM(budget_amount), 0) as totalBudget,
      SUM(CASE WHEN type = 'penetapan' THEN 1 ELSE 0 END) as penetapanCount,
      SUM(CASE WHEN type = 'perubahan' THEN 1 ELSE 0 END) as perubahanCount
    FROM aspirasi a ${where}
  `, params);

  summary.fiscalYear = fiscalYear;

  if (req.user.role === 'superadmin' && !req.dprdMemberId) {
    summary.byDprd = queryAll(`
      SELECT dm.id as dprdId, dm.name,
        COUNT(a.id) as count,
        COALESCE(SUM(a.budget_amount), 0) as budget,
        SUM(CASE WHEN a.type = 'penetapan' THEN 1 ELSE 0 END) as penetapanCount,
        SUM(CASE WHEN a.type = 'perubahan' THEN 1 ELSE 0 END) as perubahanCount
      FROM dprd_members dm
      LEFT JOIN aspirasi a ON a.dprd_member_id = dm.id AND a.fiscal_year = ?
      WHERE dm.is_active = 1
      GROUP BY dm.id
      ORDER BY budget DESC
    `, [fiscalYear]);
  }

  return res.success(reply, summary);
});

// GET /api/dashboard/chart/monthly
router.get('/chart/monthly', authMiddleware, dprdFilter, (req, reply) => {
  const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
  let where = 'WHERE a.fiscal_year = ?';
  const params = [fiscalYear];

  if (req.dprdMemberId) { where += ' AND a.dprd_member_id = ?'; params.push(req.dprdMemberId); }

  const monthly = queryAll(`
    SELECT CAST(strftime('%m', a.created_at) AS INTEGER) as month,
      COUNT(*) as count,
      COALESCE(SUM(a.budget_amount), 0) as budget
    FROM aspirasi a ${where}
    GROUP BY month ORDER BY month
  `, params);

  const allMonths = [];
  for (let m = 1; m <= 12; m++) {
    const found = monthly.find(r => r.month === m);
    allMonths.push({ month: m, count: found?.count || 0, budget: found?.budget || 0 });
  }

  return res.success(reply, allMonths);
});

// GET /api/dashboard/chart/comparison
router.get('/chart/comparison', authMiddleware, dprdFilter, (req, reply) => {
  const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();
  let where = 'WHERE fiscal_year = ?';
  const params = [fiscalYear];

  if (req.dprdMemberId) { where += ' AND dprd_member_id = ?'; params.push(req.dprdMemberId); }

  const comparison = queryAll(`
    SELECT type, COUNT(*) as count, COALESCE(SUM(budget_amount), 0) as budget
    FROM aspirasi ${where} GROUP BY type
  `, params);

  return res.success(reply, comparison);
});

// GET /api/dashboard/chart/by-dprd
router.get('/chart/by-dprd', authMiddleware, (req, reply) => {
  const fiscalYear = parseInt(req.query.fiscal_year) || new Date().getFullYear();

  const data = queryAll(`
    SELECT dm.id, dm.name, COUNT(a.id) as count, COALESCE(SUM(a.budget_amount), 0) as budget
    FROM dprd_members dm
    LEFT JOIN aspirasi a ON a.dprd_member_id = dm.id AND a.fiscal_year = ?
    WHERE dm.is_active = 1
    GROUP BY dm.id ORDER BY budget DESC
  `, [fiscalYear]);

  return res.success(reply, data);
});

export default router;
