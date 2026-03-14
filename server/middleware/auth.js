import jwt from 'jsonwebtoken';
import config from '../config.js';
import { supabase } from '../database/init.js';

export async function authMiddleware(req, res, next) {
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

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, full_name, role, dprd_member_id, dprd_members(name)')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User tidak ditemukan' }
      });
    }
    
    // Add backward compatibility for dprd_name field
    user.dprd_name = user.dprd_members?.name || null;

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
