import path from 'path';
import { fileURLToPath } from 'url';

let __dirname;
try {
  __dirname = path.dirname(fileURLToPath(import.meta.url));
} catch (e) {
  __dirname = '.';
}

export default {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'aspirasi-dprd-pan-secret-key-2026',
  JWT_EXPIRES_IN: '24h',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://hhbtrwrllydowupqwrku.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYnRyd3JsbHlkb3d1cHF3cmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjU5NTQsImV4cCI6MjA4OTAwMTk1NH0.NrNnqmwzjFHbWndCzcOEGybasAVV5g_UKEQtxkjC0r0',
  DB_PATH: process.env.VERCEL ? '' : path.join(__dirname, 'database', 'aspirasidprd.db'),
  UPLOAD_DIR: process.env.VERCEL ? '/tmp' : path.join(__dirname, 'uploads'),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_LOGIN_ATTEMPTS: 3,
  LOCK_DURATION_MINUTES: 30
};
