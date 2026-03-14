import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../database/init.js';
import { authMiddleware, roleGuard } from '../middleware/auth.js';
import * as res from '../utils/response.js';

const router = Router();

// All routes require login
router.use(authMiddleware);

// GET /api/users
// Superadmin: see all users. Admin: see users under their DPRD member
router.get('/', async (req, reply) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    
    let query = supabase
      .from('users')
      .select(`
        id, username, full_name, role, dprd_member_id,
        failed_attempts, locked_until, created_at,
        dprd_members ( name )
      `)
      .order('id', { ascending: true });

    if (!isSuperAdmin) {
      query = query.eq('dprd_member_id', req.user.dprd_member_id);
    }

    const { data: usersData, error } = await query;
    if (error) throw error;

    // Map `dprd_members.name` to `dprd_name` to match original API response
    const users = usersData.map(u => ({
      ...u,
      dprd_name: u.dprd_members?.name || null,
      dprd_members: undefined
    }));

    return res.success(reply, users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.error(reply, 500, 'Gagal mengambil data users.');
  }
});

// POST /api/users
// Superadmin: create any user. Admin: create only 'aspirator' role under their DPRD
router.post('/', async (req, reply) => {
  try {
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

    const { data: existing } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
    if (existing) return res.error(reply, 400, 'VALIDATION_ERROR', 'Username sudah digunakan');

    const hash = await bcrypt.hash(password, 10);
    const memberId = isSuperAdmin ? (dprd_member_id || null) : req.user.dprd_member_id;

    const { data: newUser, error } = await supabase.from('users').insert({
      username,
      password_hash: hash,
      full_name,
      role,
      dprd_member_id: memberId
    }).select('id, username, full_name, role, dprd_member_id').single();

    if (error) throw error;

    return res.success(reply, newUser, 'User berhasil dibuat', 201);
  } catch (err) {
    console.error('Create user error:', err.message);
    return res.error(reply, 500, 'SERVER_ERROR', 'Gagal membuat user: ' + err.message);
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, reply) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const targetId = parseInt(req.params.id);
    
    const { data: targetUser, error } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
    if (!targetUser) return res.error(reply, 404, 'NOT_FOUND', 'User tidak ditemukan');

    // Admin can only edit users under their DPRD
    if (!isSuperAdmin && targetUser.dprd_member_id !== req.user.dprd_member_id) {
      return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
    }

    const { full_name, role, dprd_member_id } = req.body;
    
    const { error: updateError } = await supabase.from('users').update({
      full_name: full_name || targetUser.full_name,
      role: role || targetUser.role,
      dprd_member_id: dprd_member_id ?? targetUser.dprd_member_id,
      updated_at: new Date().toISOString()
    }).eq('id', targetId);

    if (updateError) throw updateError;
    return res.success(reply, null, 'User berhasil diperbarui');
  } catch (err) {
    console.error('Update user error:', err.message);
    return res.error(reply, 500, 'SERVER_ERROR', 'Gagal memperbarui user');
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, reply) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const targetId = parseInt(req.params.id);
    
    if (targetId === req.user.id) return res.error(reply, 400, 'VALIDATION_ERROR', 'Tidak bisa menghapus akun sendiri');

    const { data: targetUser, error } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
    if (!targetUser) return res.error(reply, 404, 'NOT_FOUND', 'User tidak ditemukan');

    // Admin can only delete users under their DPRD
    if (!isSuperAdmin && targetUser.dprd_member_id !== req.user.dprd_member_id) {
      return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
    }

    const { error: deleteError } = await supabase.from('users').delete().eq('id', targetId);
    if (deleteError) throw deleteError;
    
    return res.success(reply, null, 'User berhasil dihapus');
  } catch (err) {
    console.error('Delete user error:', err.message);
    return res.error(reply, 500, 'SERVER_ERROR', 'Gagal menghapus user');
  }
});

// PATCH /api/users/:id/reset-password
router.patch('/:id/reset-password', async (req, reply) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const targetId = parseInt(req.params.id);
    
    const { data: targetUser, error } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
    if (!targetUser) return res.error(reply, 404, 'NOT_FOUND', 'User tidak ditemukan');

    if (!isSuperAdmin && targetUser.dprd_member_id !== req.user.dprd_member_id) {
      return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
    }

    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) return res.error(reply, 400, 'VALIDATION_ERROR', 'Password minimal 6 karakter');

    const hash = await bcrypt.hash(new_password, 10);
    const { error: updateError } = await supabase.from('users').update({
      password_hash: hash,
      updated_at: new Date().toISOString()
    }).eq('id', targetId);
    
    if (updateError) throw updateError;
    return res.success(reply, null, 'Password berhasil direset');
  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.error(reply, 500, 'SERVER_ERROR', 'Gagal mereset password');
  }
});

// PATCH /api/users/:id/unlock
router.patch('/:id/unlock', async (req, reply) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const targetId = parseInt(req.params.id);
    
    const { data: targetUser, error } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
    if (!targetUser) return res.error(reply, 404, 'NOT_FOUND', 'User tidak ditemukan');

    if (!isSuperAdmin && targetUser.dprd_member_id !== req.user.dprd_member_id) {
      return res.error(reply, 403, 'FORBIDDEN', 'Akses tidak diizinkan');
    }

    const { error: updateError } = await supabase.from('users').update({
      failed_attempts: 0,
      locked_until: null
    }).eq('id', targetId);
    
    if (updateError) throw updateError;
    return res.success(reply, null, 'Akun berhasil dibuka');
  } catch (err) {
    console.error('Unlock user error:', err.message);
    return res.error(reply, 500, 'SERVER_ERROR', 'Gagal membuka akun');
  }
});

export default router;
