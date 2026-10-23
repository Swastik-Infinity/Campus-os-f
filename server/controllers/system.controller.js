/**
 * CampusOS v1.2 — System Operations Controller
 */
const db = require('../../database/db');

const systemController = {
  // Health check endpoint
  getHealth: async (req, res, next) => {
    try {
      let dbStatus = 'connected';
      let dbLatencyMs = null;
      try {
        const start = Date.now();
        await db.query('SELECT 1');
        dbLatencyMs = Date.now() - start;
      } catch (err) {
        dbStatus = 'disconnected';
      }

      res.json({
        status: dbStatus === 'connected' ? 'ok' : 'degraded',
        service: 'CampusOS Smart Campus Operating System',
        version: '1.2.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          engine: db.getActiveEngine(),
          latencyMs: dbLatencyMs
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Reset demo storage to clean factory state (Admin only)
  resetDemo: async (req, res, next) => {
    try {
      await db.runSeeds();
      res.json({
        status: 'success',
        message: 'CampusOS factory demo data successfully restored.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = systemController;
