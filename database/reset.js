/**
 * CampusOS v1.2 — Database Reset Runner (Wipes & Reseeds)
 */
const db = require('./db');

async function main() {
  console.log('Resetting CampusOS database to clean factory state...');
  try {
    await db.initializeDatabase();
    await db.runMigrations();
    await db.runSeeds();
    console.log('✅ Factory reset completed successfully.');
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
