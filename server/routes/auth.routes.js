import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { supabase } from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';
import * as res from '../utils/response.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, reply) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.error(reply, 400, 'VALIDATION_ERROR', 'Username dan password wajib diisi');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        dprd_members ( name )
      `)
      .eq('username', username)
      .maybeSingle();

    if (userError) throw userError;

    if (!user) {
      return res.error(reply, 401, 'UNAUTHORIZED', 'Username atau password salah');
    }

    // Check if account is locked
    if (user.locked_until) {
      const lockTime = new Date(user.locked_until);
      if (lockTime > new Date()) {
        return res.error(reply, 423, 'ACCOUNT_LOCKED', 'Akun terkunci', {
          lockedUntil: user.locked_until
        });
      } else {
        await supabase.from('users').update({ failed_attempts: 0, locked_until: null }).eq('id', user.id);
      }
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);

    if (!isValid) {
      const attempts = (user.failed_attempts || 0) + 1;
      if (attempts >= config.MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + config.LOCK_DURATION_MINUTES * 60 * 1000).toISOString();
        await supabase.from('users').update({ failed_attempts: attempts, locked_until: lockUntil }).eq('id', user.id);
        return res.error(reply, 423, 'ACCOUNT_LOCKED', 'Akun terkunci selama 30 menit', { lockedUntil: lockUntil });
      }
      await supabase.from('users').update({ failed_attempts: attempts }).eq('id', user.id);
      return res.error(reply, 401, 'UNAUTHORIZED', 'Username atau password salah', {
        attemptsLeft: config.MAX_LOGIN_ATTEMPTS - attempts
      });
    }

    // Reset failed attempts
    await supabase.from('users').update({ failed_attempts: 0, locked_until: null }).eq('id', user.id);

    const dprdName = user.dprd_members?.name || null;

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, dprdMemberId: user.dprd_member_id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const userData = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      dprdMember: user.dprd_member_id ? { id: user.dprd_member_id, name: dprdName } : null
    };

    return res.success(reply, { token, user: userData }, 'Login berhasil');
  } catch (err) {
    console.error('Login error:', err);
    return res.error(reply, 500, 'SERVER_ERROR', 'Terjadi kesalahan pada server');
  }
});

// GET /api/auth/me
// authMiddleware will inject req.user (since the middleware gets token from header)
// However, req.user from token only has basic info.
// If you want full up-to-date data, we can query it, or just return what middleware gives.
// Let's assume authMiddleware injects up-to-date user.
router.get('/me', authMiddleware, (req, reply) => {
  const userData = {
    id: req.user.id,
    username: req.user.username,
    fullName: req.user.full_name,
    role: req.user.role,
    dprdMember: req.user.dprd_member_id ? { id: req.user.dprd_member_id, name: req.user.dprd_name } : null
  };
  return res.success(reply, userData);
});

export default router;
