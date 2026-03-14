import { createClient } from '@supabase/supabase-js';
import config from '../config.js';

// Initialize Supabase Client
const supabaseUrl = config.SUPABASE_URL;
const supabaseKey = config.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// We no longer need an async init function since Supabase client is synchronous
export async function initDatabase() {
  console.log('✅ Connected to Supabase PostgreSQL at:', supabaseUrl);
}

// Deprecated helpers - these will throw errors to help us find missed refactors
export function queryAll(sql, params = []) {
  throw new Error('queryAll is deprecated, use supabase directly. Query: ' + sql);
}

export function queryOne(sql, params = []) {
  throw new Error('queryOne is deprecated, use supabase directly. Query: ' + sql);
}

export function runSql(sql, params = []) {
  throw new Error('runSql is deprecated, use supabase directly. Query: ' + sql);
}

export function getDb() {
  throw new Error('getDb is deprecated');
}

export function saveDb() {
  // no-op for backward compatibility if called somewhere
}

// Run if executed directly
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('init.js');
if (isDirectRun) {
  initDatabase();
}
