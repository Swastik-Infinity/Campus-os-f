/**
 * CampusOS v1.2 — Configuration Loader
 */
const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  jwt: {
    secret: process.env.JWT_SECRET || 'campusos-default-development-jwt-secret-key-32chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 200,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 50
  },
  rolePermissions: {
    student: ['dashboard', 'campusfix', 'attendance', 'leave', 'notices', 'services'],
    faculty: ['dashboard', 'campusfix', 'attendance', 'leave', 'notices'],
    staff: ['dashboard', 'campusfix', 'assets', 'inventory'],
    admin: ['dashboard', 'campusfix', 'attendance', 'leave', 'notices', 'services', 'assets', 'inventory']
  }
};

module.exports = config;
