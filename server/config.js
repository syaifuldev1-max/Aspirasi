import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'aspirasi-dprd-pan-secret-key-2026',
  JWT_EXPIRES_IN: '24h',
  DB_PATH: path.join(__dirname, 'database', 'aspirasidprd.db'),
  UPLOAD_DIR: path.join(__dirname, 'uploads'),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_LOGIN_ATTEMPTS: 3,
  LOCK_DURATION_MINUTES: 30
};
