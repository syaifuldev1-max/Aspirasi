import initSqlJs from 'sql.js';
import config from '../config.js';
import fs from 'fs';
import path from 'path';

let db = null;

export async function getDb() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  const dbDir = path.dirname(config.DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing DB or create new
  if (fs.existsSync(config.DB_PATH)) {
    const buffer = fs.readFileSync(config.DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

export function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.DB_PATH, buffer);
  }
}

export async function initDatabase() {
  const db = await getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS dprd_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      party TEXT DEFAULT 'PAN',
      phone TEXT,
      photo_url TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'superadmin', 'aspirator')),
      dprd_member_id INTEGER,
      failed_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (dprd_member_id) REFERENCES dprd_members(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS aspirasi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT NOT NULL UNIQUE,
      dprd_member_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('penetapan', 'perubahan')),
      proposer_name TEXT NOT NULL,
      proposer_phone TEXT,
      proposer_address TEXT,
      description TEXT,
      budget_amount REAL NOT NULL DEFAULT 0,
      fiscal_year INTEGER NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'verified', 'rejected')),
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (dprd_member_id) REFERENCES dprd_members(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aspirasi_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      original_name TEXT,
      file_size INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (aspirasi_id) REFERENCES aspirasi(id) ON DELETE CASCADE
    )
  `);

  // Create indexes (ignore if exists)
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_aspirasi_dprd ON aspirasi(dprd_member_id)',
    'CREATE INDEX IF NOT EXISTS idx_aspirasi_year ON aspirasi(fiscal_year)',
    'CREATE INDEX IF NOT EXISTS idx_aspirasi_type ON aspirasi(type)',
    'CREATE INDEX IF NOT EXISTS idx_aspirasi_ref ON aspirasi(reference_no)',
    'CREATE INDEX IF NOT EXISTS idx_photos_aspirasi ON photos(aspirasi_id)',
  ];
  indexes.forEach(sql => db.run(sql));

  db.run('PRAGMA foreign_keys = ON');
  // --- Migration: add aspirator role to existing DBs ---
  try {
    // Clean up any leftover temp tables from failed migrations
    try { db.run(`DROP TABLE IF EXISTS users_old`); } catch(e2) {}
    try { db.run(`DROP TABLE IF EXISTS users_backup`); } catch(e2) {}

    // Check if the constraint already allows 'aspirator'
    db.run(`INSERT INTO users (username, password_hash, full_name, role) VALUES ('__migration_test__', 'x', 'x', 'aspirator')`);
    db.run(`DELETE FROM users WHERE username = '__migration_test__'`);
    console.log('✅ Aspirator role already supported');
  } catch (e) {
    // Constraint doesn't allow 'aspirator' — recreate users table
    console.log('🔄 Migrating users table to add aspirator role...');
    try {
      db.run(`ALTER TABLE users RENAME TO users_old`);
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'superadmin', 'aspirator')),
          dprd_member_id INTEGER,
          failed_attempts INTEGER DEFAULT 0,
          locked_until TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (dprd_member_id) REFERENCES dprd_members(id)
        )
      `);
      db.run(`INSERT INTO users (id, username, password_hash, full_name, role, dprd_member_id, failed_attempts, locked_until, created_at, updated_at) SELECT id, username, password_hash, full_name, role, dprd_member_id, failed_attempts, locked_until, created_at, updated_at FROM users_old`);
      db.run(`DROP TABLE users_old`);
      console.log('✅ Migration complete');
    } catch (migErr) {
      console.error('Migration error, will use fresh DB:', migErr.message);
      // If migration fails, just drop and recreate
      try { db.run(`DROP TABLE IF EXISTS users_old`); } catch(e3) {}
      try { db.run(`DROP TABLE IF EXISTS users`); } catch(e3) {}
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'superadmin', 'aspirator')),
          dprd_member_id INTEGER,
          failed_attempts INTEGER DEFAULT 0,
          locked_until TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (dprd_member_id) REFERENCES dprd_members(id)
        )
      `);
      console.log('✅ Fresh users table created');
    }
  }

  saveDb();
  console.log('✅ Database tables created/verified');
}

// Helper: run a query that returns rows
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query that returns one row
export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run an INSERT/UPDATE/DELETE and return info
export function runSql(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0];
  const changes = db.getRowsModified();
  saveDb();
  return { lastInsertRowid: lastId, changes };
}

// Run if executed directly
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('init.js');
if (isDirectRun) {
  await initDatabase();
  console.log('📦 Database initialized at:', config.DB_PATH);
}
