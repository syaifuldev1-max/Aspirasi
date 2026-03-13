import { Router } from 'express';
import { queryAll } from '../database/init.js';
import * as res from '../utils/response.js';

const router = Router();

// GET /api/dprd-members (public, for login dropdown)
router.get('/', (req, reply) => {
  const members = queryAll('SELECT id, name, party, phone FROM dprd_members WHERE is_active = 1 ORDER BY id');
  return res.success(reply, members);
});

export default router;
