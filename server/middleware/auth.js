import jwt from 'jsonwebtoken';
import config from '../config.js';
import { queryOne } from '../database/init.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token tidak ditemukan' }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = queryOne(`
      SELECT u.id, u.username, u.full_name, u.role, u.dprd_member_id,
             dm.name as dprd_name
      FROM users u
      LEFT JOIN dprd_members dm ON u.dprd_member_id = dm.id
      WHERE u.id = ?
    `, [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User tidak ditemukan' }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token tidak valid atau expired' }
    });
  }
}

export function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Akses tidak diizinkan' }
      });
    }
    next();
  };
}

export function dprdFilter(req, res, next) {
  if (req.user.role === 'admin') {
    req.dprdMemberId = req.user.dprd_member_id;
  } else {
    req.dprdMemberId = req.query.dprd_member_id
      ? parseInt(req.query.dprd_member_id)
      : null;
  }
  next();
}
