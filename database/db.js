/**
 * CampusOS v1.2 — Database Abstraction Layer
 * Supports PostgreSQL (via pg pool for Supabase & production)
 * and automatic built-in SQLite relational fallback for offline development & tests.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let pgPool = null;
let sqliteDb = null;
let activeEngine = 'none';

function getDatabaseConfig() {
  const connectionString = process.env.DATABASE_URL || '';
  const isSsl = process.env.DATABASE_SSL === 'true' || connectionString.includes('supabase.co');
  return {
    connectionString,
    ssl: isSsl ? { rejectUnauthorized: false } : false
  };
}

/**
 * Initialize connection pool or local fallback
 */
async function initializeDatabase() {
  const config = getDatabaseConfig();

  // Try PostgreSQL if DATABASE_URL is supplied
  if (config.connectionString && !process.env.FORCE_SQLITE_TEST) {
    try {
      pgPool = new Pool({
        connectionString: config.connectionString,
        ssl: config.ssl,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 20
      });

      // Quick test query
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();

      activeEngine = 'postgresql';
      console.log('✅ Connected to PostgreSQL database successfully.');
      return activeEngine;
    } catch (err) {
      console.warn(`⚠️ PostgreSQL connection attempt failed: ${err.message}`);
      if (pgPool) {
        await pgPool.end().catch(() => {});
        pgPool = null;
      }
    }
  }

  // Fallback to built-in SQLite (Node.js 22+ node:sqlite)
  if (process.env.ENABLE_LOCAL_FALLBACK !== 'false' || process.env.NODE_ENV === 'test') {
    try {
      const { DatabaseSync } = require('node:sqlite');
      const dbPath = process.env.SQLITE_FILE || ':memory:';
      sqliteDb = new DatabaseSync(dbPath);
      activeEngine = 'sqlite';
      console.log(`ℹ️ Running with local relational fallback engine (${dbPath === ':memory:' ? 'in-memory SQLite' : dbPath}).`);
      
      // Auto run schema in sqlite fallback
      await runSqliteMigrations();
      await runSqliteSeeds();
      return activeEngine;
    } catch (err) {
      console.error('❌ Failed to initialize local SQLite engine:', err);
      throw err;
    }
  }

  throw new Error('No database available: DATABASE_URL not configured and local fallback is disabled.');
}

/**
 * Universal query runner: translates parameter syntax ($1, $2 -> ? for SQLite)
 */
async function query(text, params = []) {
  if (!activeEngine || activeEngine === 'none') {
    await initializeDatabase();
  }

  if (activeEngine === 'postgresql') {
    const start = Date.now();
    try {
      const res = await pgPool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.log('Executed SQL:', { text, duration, rows: res.rowCount });
      }
      return res;
    } catch (err) {
      console.error('PostgreSQL query error:', { text, params, error: err.message });
      throw err;
    }
  }

  if (activeEngine === 'sqlite') {
    return runSqliteQuery(text, params);
  }

  throw new Error('Database not initialized');
}

/**
 * Execute query against SQLite fallback with PostgreSQL compatibility translation
 */
function runSqliteQuery(text, params = []) {
  // Translate PostgreSQL parameterized $1, $2 to SQLite ?
  let sqliteQuery = text.replace(/\$(\d+)/g, '?');

  // Convert PostgreSQL specific intervals, JSONB operators, and types if present
  sqliteQuery = sqliteQuery
    .replace(/::jsonb/gi, '')
    .replace(/JSONB/gi, 'TEXT')
    .replace(/NOW\(\) - INTERVAL '(\d+) days'/gi, "datetime('now', '-$1 days')")
    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");

  // Format array params to JSON strings for SQLite
  const formattedParams = params.map(p => {
    if (p !== null && typeof p === 'object' && !Array.isArray(p) && !(p instanceof Date)) {
      return JSON.stringify(p);
    }
    if (Array.isArray(p)) {
      return JSON.stringify(p);
    }
    if (p instanceof Date) {
      return p.toISOString();
    }
    return p;
  });

  const trimmed = sqliteQuery.trim();
  const isSelect = /^SELECT/i.test(trimmed);
  const isInsert = /^INSERT/i.test(trimmed);
  const isUpdate = /^UPDATE/i.test(trimmed);
  const isDelete = /^DELETE/i.test(trimmed);

  try {
    const stmt = sqliteDb.prepare(sqliteQuery);
    if (isSelect) {
      const rows = stmt.all(...formattedParams);
      // Auto-parse JSON columns where applicable
      const processed = rows.map(r => {
        const copy = { ...r };
        for (const k of Object.keys(copy)) {
          if (typeof copy[k] === 'string' && (copy[k].startsWith('[') || copy[k].startsWith('{'))) {
            try { copy[k] = JSON.parse(copy[k]); } catch (e) {}
          }
        }
        return copy;
      });
      return { rows: processed, rowCount: rows.length };
    } else {
      const result = stmt.run(...formattedParams);
      return {
        rows: [],
        rowCount: result.changes,
        lastInsertRowid: result.lastInsertRowid
      };
    }
  } catch (err) {
    console.error('SQLite query error:', { query: sqliteQuery, params: formattedParams, error: err.message });
    throw err;
  }
}

/**
 * Transaction helper
 */
async function transaction(callback) {
  if (!activeEngine || activeEngine === 'none') {
    await initializeDatabase();
  }

  if (activeEngine === 'postgresql') {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  if (activeEngine === 'sqlite') {
    sqliteDb.exec('BEGIN TRANSACTION');
    try {
      const result = await callback({
        query: (t, p) => runSqliteQuery(t, p)
      });
      sqliteDb.exec('COMMIT');
      return result;
    } catch (err) {
      sqliteDb.exec('ROLLBACK');
      throw err;
    }
  }
}

/**
 * Run migrations for SQLite fallback
 */
async function runSqliteMigrations() {
  const schemaFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  if (!fs.existsSync(schemaFile)) return;

  let sql = fs.readFileSync(schemaFile, 'utf8');

  // Strip line comments first
  sql = sql.replace(/--.*$/gm, '');

  // Adapt PostgreSQL DDL to SQLite DDL
  sql = sql
    .replace(/::jsonb/gi, '')
    .replace(/\bTIMESTAMP WITH TIME ZONE\b/gi, 'TEXT')
    .replace(/\bTIMESTAMP\b/gi, 'TEXT')
    .replace(/\bDATE\b/gi, 'TEXT')
    .replace(/\bSERIAL PRIMARY KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/\bJSONB\b/gi, 'TEXT')
    .replace(/\bBOOLEAN\b/gi, 'INTEGER')
    .replace(/DEFAULT CURRENT_TIMESTAMP/gi, "DEFAULT (datetime('now'))")
    .replace(/DEFAULT CURRENT_DATE/gi, "DEFAULT (date('now'))")
    .replace(/DEFAULT NOW\(\)/gi, "DEFAULT (datetime('now'))");

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      sqliteDb.exec(statement);
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.warn('SQLite migration warning:', err.message);
      }
    }
  }
}

/**
 * Run seeds for SQLite fallback
 */
async function runSqliteSeeds() {
  const seedFile = path.join(__dirname, 'seeds', '001_initial_seed.sql');
  if (!fs.existsSync(seedFile)) return;

  let sql = fs.readFileSync(seedFile, 'utf8');

  // Strip line comments
  sql = sql.replace(/--.*$/gm, '');

  // Adapt PostgreSQL seed SQL to SQLite
  sql = sql
    .replace(/::jsonb/gi, '')
    .replace(/\bTRUE\b/gi, '1')
    .replace(/\bFALSE\b/gi, '0')
    .replace(/NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*days?'/gi, "datetime('now', '-$1 days')")
    .replace(/NOW\(\)/gi, "datetime('now')");

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      sqliteDb.exec(statement);
    } catch (err) {
      // In SQLite, DO UPDATE in ON CONFLICT is supported in 3.24+, but some syntax may vary
      if (!err.message.includes('UNIQUE constraint failed')) {
        console.warn('Seed statement skipped in SQLite:', err.message);
      }
    }
  }
}

/**
 * Migration runner for PostgreSQL
 */
async function runMigrations() {
  if (activeEngine !== 'postgresql') {
    if (!activeEngine || activeEngine === 'none') {
      await initializeDatabase();
    }
    if (activeEngine === 'sqlite') {
      await runSqliteMigrations();
      return;
    }
  }

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Running PostgreSQL migration: ${file}...`);
      await query(sql);
      console.log(`Migration ${file} executed successfully.`);
    }
  }
}

/**
 * Seed runner for PostgreSQL
 */
async function runSeeds() {
  if (activeEngine !== 'postgresql') {
    if (!activeEngine || activeEngine === 'none') {
      await initializeDatabase();
    }
    if (activeEngine === 'sqlite') {
      await runSqliteSeeds();
      return;
    }
  }

  const seedsDir = path.join(__dirname, 'seeds');
  const files = fs.readdirSync(seedsDir).sort();

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Running seed script: ${file}...`);
      await query(sql);
      console.log(`Seed ${file} executed successfully.`);
    }
  }
}

async function close() {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  activeEngine = 'none';
}

function getActiveEngine() {
  return activeEngine;
}

module.exports = {
  initializeDatabase,
  query,
  transaction,
  runMigrations,
  runSeeds,
  close,
  getActiveEngine
};
