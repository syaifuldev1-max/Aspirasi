import { Router } from 'express';
import { queryAll, queryOne, runSql } from '../database/init.js';
import { authMiddleware, dprdFilter } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { generateRefNo } from '../utils/ref-generator.js';
import * as res from '../utils/response.js';

const router = Router();

// GET /api/aspirasi
router.get('/', authMiddleware, dprdFilter, (req, reply) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  // For admin: auto-filter by their DPRD member. For super admin: use optional query param
  if (req.dprdMemberId) {
    where += ' AND a.dprd_member_id = ?'; params.push(req.dprdMemberId);
  } else if (req.query.dprd_member_id) {
    where += ' AND a.dprd_member_id = ?'; params.push(parseInt(req.query.dprd_member_id));
  }
  if (req.query.type) { where += ' AND a.type = ?'; params.push(req.query.type); }
  if (req.query.fiscal_year) { where += ' AND a.fiscal_year = ?'; params.push(parseInt(req.query.fiscal_year)); }
  if (req.query.status) { where += ' AND a.status = ?'; params.push(req.query.status); }
  if (req.query.search) {
    where += ' AND (a.proposer_name LIKE ? OR a.reference_no LIKE ?)';
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }

  const sort = req.query.sort || 'created_at';
  const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
  const allowedSorts = ['created_at', 'budget_amount', 'proposer_name', 'reference_no'];
  const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';

  const countRow = queryOne(`SELECT COUNT(*) as count FROM aspirasi a ${where}`, params);
  const total = countRow?.count || 0;

  const data = queryAll(`
    SELECT a.*, dm.name as dprd_name
    FROM aspirasi a
    JOIN dprd_members dm ON a.dprd_member_id = dm.id
    ${where}
    ORDER BY a.${safeSort} ${order}
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  return res.paginated(reply, data, total, page, limit);
});

// GET /api/aspirasi/:id
router.get('/:id', authMiddleware, dprdFilter, (req, reply) => {
  const aspirasi = queryOne(`
    SELECT a.*, dm.name as dprd_name, u.full_name as created_by_name
    FROM aspirasi a
    JOIN dprd_members dm ON a.dprd_member_id = dm.id
    JOIN users u ON a.created_by = u.id
    WHERE a.id = ?
  `, [parseInt(req.params.id)]);

  if (!aspirasi) return res.error(reply, 404, 'NOT_FOUND', 'Aspirasi tidak ditemukan');
  if (req.dprdMemberId && aspirasi.dprd_member_id !== req.dprdMemberId) {
    return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
  }

  aspirasi.photos = queryAll('SELECT * FROM photos WHERE aspirasi_id = ?', [aspirasi.id]);
  return res.success(reply, aspirasi);
});

// POST /api/aspirasi
router.post('/', authMiddleware, dprdFilter, upload.array('photos', 5), (req, reply) => {
  const { type, proposer_name, proposer_phone, proposer_address, description, budget_amount } = req.body;
  let dprdMemberId = req.dprdMemberId;

  if (req.user.role === 'superadmin') {
    dprdMemberId = parseInt(req.body.dprd_member_id);
    if (!dprdMemberId) return res.error(reply, 400, 'VALIDATION_ERROR', 'Pilih anggota DPRD tujuan');
  }

  if (!type || !proposer_name || !budget_amount) {
    return res.error(reply, 400, 'VALIDATION_ERROR', 'Tipe, nama pengusul, dan anggaran wajib diisi');
  }
  if (!['penetapan', 'perubahan'].includes(type)) {
    return res.error(reply, 400, 'VALIDATION_ERROR', 'Tipe harus penetapan atau perubahan');
  }

  const fiscalYear = new Date().getFullYear();
  const referenceNo = generateRefNo(fiscalYear);

  const result = runSql(`
    INSERT INTO aspirasi (reference_no, dprd_member_id, type, proposer_name, proposer_phone, proposer_address, description, budget_amount, fiscal_year, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [referenceNo, dprdMemberId, type, proposer_name, proposer_phone || null, proposer_address || null, description || null, parseFloat(budget_amount), fiscalYear, req.user.id]);

  const aspirasiId = result.lastInsertRowid;

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      runSql('INSERT INTO photos (aspirasi_id, file_path, original_name, file_size) VALUES (?, ?, ?, ?)',
        [aspirasiId, `/uploads/${file.filename}`, file.originalname, file.size]);
    }
  }

  const aspirasi = queryOne('SELECT * FROM aspirasi WHERE id = ?', [aspirasiId]);
  aspirasi.photos = queryAll('SELECT * FROM photos WHERE aspirasi_id = ?', [aspirasiId]);
  return res.success(reply, aspirasi, 'Aspirasi berhasil disimpan', 201);
});

// PUT /api/aspirasi/:id
router.put('/:id', authMiddleware, dprdFilter, upload.array('photos', 5), (req, reply) => {
  const aspirasi = queryOne('SELECT * FROM aspirasi WHERE id = ?', [parseInt(req.params.id)]);
  if (!aspirasi) return res.error(reply, 404, 'NOT_FOUND', 'Aspirasi tidak ditemukan');
  if (req.dprdMemberId && aspirasi.dprd_member_id !== req.dprdMemberId) {
    return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
  }

  const { type, proposer_name, proposer_phone, proposer_address, description, budget_amount, status } = req.body;
  runSql(`UPDATE aspirasi SET type = ?, proposer_name = ?, proposer_phone = ?, proposer_address = ?, description = ?, budget_amount = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
    [type || aspirasi.type, proposer_name || aspirasi.proposer_name, proposer_phone || aspirasi.proposer_phone, proposer_address || aspirasi.proposer_address, description ?? aspirasi.description, budget_amount ? parseFloat(budget_amount) : aspirasi.budget_amount, status || aspirasi.status, parseInt(req.params.id)]);

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      runSql('INSERT INTO photos (aspirasi_id, file_path, original_name, file_size) VALUES (?, ?, ?, ?)',
        [parseInt(req.params.id), `/uploads/${file.filename}`, file.originalname, file.size]);
    }
  }

  const updated = queryOne('SELECT * FROM aspirasi WHERE id = ?', [parseInt(req.params.id)]);
  updated.photos = queryAll('SELECT * FROM photos WHERE aspirasi_id = ?', [parseInt(req.params.id)]);
  return res.success(reply, updated, 'Aspirasi berhasil diperbarui');
});

// DELETE /api/aspirasi/:id
router.delete('/:id', authMiddleware, dprdFilter, (req, reply) => {
  const aspirasi = queryOne('SELECT * FROM aspirasi WHERE id = ?', [parseInt(req.params.id)]);
  if (!aspirasi) return res.error(reply, 404, 'NOT_FOUND', 'Aspirasi tidak ditemukan');
  if (req.dprdMemberId && aspirasi.dprd_member_id !== req.dprdMemberId) {
    return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
  }

  runSql('DELETE FROM photos WHERE aspirasi_id = ?', [parseInt(req.params.id)]);
  runSql('DELETE FROM aspirasi WHERE id = ?', [parseInt(req.params.id)]);
  return res.success(reply, null, 'Aspirasi berhasil dihapus');
});

// PATCH /api/aspirasi/:id/status
router.patch('/:id/status', authMiddleware, dprdFilter, (req, reply) => {
  const { status } = req.body;
  if (!status || !['draft', 'verified', 'rejected'].includes(status)) {
    return res.error(reply, 400, 'VALIDATION_ERROR', 'Status harus draft, verified, atau rejected');
  }

  const aspirasi = queryOne('SELECT * FROM aspirasi WHERE id = ?', [parseInt(req.params.id)]);
  if (!aspirasi) return res.error(reply, 404, 'NOT_FOUND', 'Aspirasi tidak ditemukan');
  if (req.dprdMemberId && aspirasi.dprd_member_id !== req.dprdMemberId) {
    return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
  }

  runSql("UPDATE aspirasi SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, parseInt(req.params.id)]);
  return res.success(reply, { id: aspirasi.id, status }, 'Status berhasil diperbarui');
});

export default router;
