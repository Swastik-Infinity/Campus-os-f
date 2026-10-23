/**
 * CampusOS v1.2 — Database Seed Runner
 */
const db = require('./db');

async function main() {
  console.log('Starting CampusOS database seeding...');
  try {
    await db.initializeDatabase();
    await db.runSeeds();
    console.log('✅ Seeding completed successfully.');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
