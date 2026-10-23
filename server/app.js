/**
 * CampusOS v1.2 — Express Application Setup
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/auth.routes');
const ticketsRoutes = require('./routes/tickets.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const leavesRoutes = require('./routes/leaves.routes');
const noticesRoutes = require('./routes/notices.routes');
const servicesRoutes = require('./routes/services.routes');
const assetsRoutes = require('./routes/assets.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const systemRoutes = require('./routes/system.routes');

const app = express();

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for local preview & testing
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body Parsing & Cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests created from this IP, please try again after 15 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'TOO_MANY_AUTH_ATTEMPTS',
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});

// Apply rate limiting in non-test environments
if (config.nodeEnv !== 'test') {
  app.use('/api/', globalLimiter);
  app.use('/api/v1/auth/login', authLimiter);
}

// Static File Serving (Existing Frontend HTML/CSS/JS)
const publicDir = path.join(__dirname, '..', 'public');
const rootDir = path.join(__dirname, '..');

app.use(express.static(publicDir));
app.use(express.static(rootDir, { index: false }));

// Explicit route to serve campusos-v1.2.html and index.html
app.get(['/', '/index.html'], (req, res) => {
  const file = path.join(publicDir, 'index.html');
  res.sendFile(file);
});

app.get('/campusos-v1.2.html', (req, res) => {
  const file = path.join(publicDir, 'campusos-v1.2.html');
  res.sendFile(file);
});

// API Routes Mounting
const prefix = config.apiPrefix;
app.use(`${prefix}/auth`, authRoutes);
app.use(`${prefix}/tickets`, ticketsRoutes);
app.use(`${prefix}/attendance`, attendanceRoutes);
app.use(`${prefix}/leaves`, leavesRoutes);
app.use(`${prefix}/notices`, noticesRoutes);
app.use(`${prefix}/services`, servicesRoutes);
app.use(`${prefix}/assets`, assetsRoutes);
app.use(`${prefix}/inventory`, inventoryRoutes);
app.use(`${prefix}/notifications`, notificationsRoutes);
app.use(`${prefix}/system`, systemRoutes);
app.get(`${prefix}/health`, (req, res, next) => systemRoutes.handle(req, res, next));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'ENDPOINT_NOT_FOUND',
    message: `API endpoint '${req.originalUrl}' does not exist.`
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
