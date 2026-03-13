import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, runSql } from '../database/init.js';
import { authMiddleware, roleGuard } from '../middleware/auth.js';
import * as res from '../utils/response.js';

const router = Router();

// All routes require login
router.use(authMiddleware);

// GET /api/users
// Superadmin: see all users. Admin: see users under their DPRD member
router.get('/', (req, reply) => {
  const isSuperAdmin = req.user.role === 'superadmin';

  let where = '';
  const params = [];

  if (!isSuperAdmin) {
    where = 'WHERE u.dprd_member_id = ?';
    params.push(req.user.dprd_member_id);
  }

  const users = queryAll(`
    SELECT u.id, u.username, u.full_name, u.role, u.dprd_member_id,
           dm.name as dprd_name, u.failed_attempts, u.locked_until, u.created_at
    FROM users u LEFT JOIN dprd_members dm ON u.dprd_member_id = dm.id
    ${where}
    ORDER BY u.id
  `, params);
  return res.success(reply, users);
});

// POST /api/users
// Superadmin: create any user. Admin: create only 'aspirator' role under their DPRD
router.post('/', async (req, reply) => {
  const isSuperAdmin = req.user.role === 'superadmin';
  const { username, password, full_name, role, dprd_member_id } = req.body;

  if (!username || !password || !full_name || !role) {
    return res.error(reply, 400, 'VALIDATION_ERROR', 'Semua field wajib diisi');
  }

  // Admin can only create 'aspirator' role under their own DPRD
  if (!isSuperAdmin) {
    if (role !== 'aspirator') {
      return res.error(reply, 403, 'FORBIDDEN', 'Admin hanya dapat menambah user aspirator');
    }
  }

  const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) return res.error(reply, 400, 'VALIDATION_ERROR', 'Username sudah digunakan');

  const hash = await bcrypt.hash(password, 10);
  const memberId = isSuperAdmin ? (dprd_member_id || null) : req.user.dprd_member_id;

  try {
    const result = runSql('INSERT INTO users (username, password_hash, full_name, role, dprd_member_id) VALUES (?, ?, ?, ?, ?)',
      [username, hash, full_name, role, memberId]);

    const user = queryOne('SELECT id, username, full_name, role, dprd_member_id FROM users WHERE id = ?', [result.lastInsertRowid]);
    return res.success(reply, user, 'User berhasil dibuat', 201);
  } catch (err) {
    console.error('Create user error:', err.message);
    return res.error(reply, 500, 'SERVER_ERROR', 'Gagal membuat user: ' + err.message);
  }
});

// PUT /api/users/:id
router.put('/:id', (req, reply) => {
  const isSuperAdmin = req.user.role === 'superadmin';
  const targetUser = queryOne('SELECT * FROM users WHERE id = ?', [parseInt(req.params.id)]);
  if (!targetUser) return res.error(reply, 404, 'NOT_FOUND', 'User tidak ditemukan');

  // Admin can only edit users under their DPRD
  if (!isSuperAdmin && targetUser.dprd_member_id !== req.user.dprd_member_id) {
    return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
  }

  const { full_name, role, dprd_member_id } = req.body;
  runSql("UPDATE users SET full_name = ?, role = ?, dprd_member_id = ?, updated_at = datetime('now') WHERE id = ?",
    [full_name || targetUser.full_name, role || targetUser.role, dprd_member_id ?? targetUser.dprd_member_id, parseInt(req.params.id)]);
  return res.success(reply, null, 'User berhasil diperbarui');
});

// DELETE /api/users/:id
router.delete('/:id', (req, reply) => {
  const isSuperAdmin = req.user.role === 'superadmin';
  if (parseInt(req.params.id) === req.user.id) return res.error(reply, 400, 'VALIDATION_ERROR', 'Tidak bisa menghapus akun sendiri');

  const targetUser = queryOne('SELECT * FROM users WHERE id = ?', [parseInt(req.params.id)]);
  if (!targetUser) return res.error(reply, 404, 'NOT_FOUND', 'User tidak ditemukan');

  // Admin can only delete users under their DPRD
  if (!isSuperAdmin && targetUser.dprd_member_id !== req.user.dprd_member_id) {
    return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
  }

  runSql('DELETE FROM users WHERE id = ?', [parseInt(req.params.id)]);
  return res.success(reply, null, 'User berhasil dihapus');
});

// PATCH /api/users/:id/reset-password
router.patch('/:id/reset-password', async (req, reply) => {
  const isSuperAdmin = req.user.role === 'superadmin';
  const targetUser = queryOne('SELECT * FROM users WHERE id = ?', [parseInt(req.params.id)]);
  if (!targetUser) return res.error(reply, 404, 'NOT_FOUND', 'User tidak ditemukan');

  if (!isSuperAdmin && targetUser.dprd_member_id !== req.user.dprd_member_id) {
    return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
  }

  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) return res.error(reply, 400, 'VALIDATION_ERROR', 'Password minimal 6 karakter');

  const hash = await bcrypt.hash(new_password, 10);
  runSql("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [hash, parseInt(req.params.id)]);
  return res.success(reply, null, 'Password berhasil direset');
});

// PATCH /api/users/:id/unlock
router.patch('/:id/unlock', (req, reply) => {
  const isSuperAdmin = req.user.role === 'superadmin';
  const targetUser = queryOne('SELECT * FROM users WHERE id = ?', [parseInt(req.params.id)]);
  if (!targetUser) return res.error(reply, 404, 'NOT_FOUND', 'User tidak ditemukan');

  if (!isSuperAdmin && targetUser.dprd_member_id !== req.user.dprd_member_id) {
    return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
  }

  runSql('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [parseInt(req.params.id)]);
  return res.success(reply, null, 'Akun berhasil dibuka');
});

export default router;
