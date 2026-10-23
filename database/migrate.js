/**
 * CampusOS v1.2 — Database Migration Runner
 */
const db = require('./db');

async function main() {
  console.log('Starting CampusOS database migrations...');
  try {
    await db.initializeDatabase();
    await db.runMigrations();
    console.log('✅ Migrations completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
