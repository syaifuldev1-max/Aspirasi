import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { queryOne, runSql } from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';
import * as res from '../utils/response.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, reply) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.error(reply, 400, 'VALIDATION_ERROR', 'Username dan password wajib diisi');
  }

  const user = queryOne(`
    SELECT u.*, dm.name as dprd_name
    FROM users u
    LEFT JOIN dprd_members dm ON u.dprd_member_id = dm.id
    WHERE u.username = ?
  `, [username]);

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
      runSql('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);
    }
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);

  if (!isValid) {
    const attempts = user.failed_attempts + 1;
    if (attempts >= config.MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + config.LOCK_DURATION_MINUTES * 60 * 1000).toISOString();
      runSql('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?', [attempts, lockUntil, user.id]);
      return res.error(reply, 423, 'ACCOUNT_LOCKED', 'Akun terkunci selama 30 menit', { lockedUntil: lockUntil });
    }
    runSql('UPDATE users SET failed_attempts = ? WHERE id = ?', [attempts, user.id]);
    return res.error(reply, 401, 'UNAUTHORIZED', 'Username atau password salah', {
      attemptsLeft: config.MAX_LOGIN_ATTEMPTS - attempts
    });
  }

  // Reset failed attempts
  runSql('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [user.id]);

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
    dprdMember: user.dprd_member_id ? { id: user.dprd_member_id, name: user.dprd_name } : null
  };

  return res.success(reply, { token, user: userData }, 'Login berhasil');
});

// GET /api/auth/me
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
