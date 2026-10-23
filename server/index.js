/**
 * CampusOS v1.2 — Server Entry Point
 */
const app = require('./app');
const config = require('./config');
const db = require('../database/db');

async function startServer() {
  try {
    console.log('🚀 Initializing CampusOS v1.2 Database...');
    await db.initializeDatabase();

    const server = app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🏛️  CampusOS v1.2 — Smart Campus Operating System`);
      console.log(`📡 Server running on http://localhost:${config.port}`);
      console.log(`🔌 REST API Base URL: http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`📊 Health Endpoint: http://localhost:${config.port}${config.apiPrefix}/system/health`);
      console.log(`💻 Active Database Engine: ${db.getActiveEngine().toUpperCase()}`);
      console.log(`======================================================\n`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await db.close();
        console.log('Server and database connections terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
