/**
 * CampusOS v1.2 — Authentication & RBAC Middleware
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../../database/db');

async function authenticate(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.session_token) {
    token = req.cookies.session_token;
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const result = await db.query(
      'SELECT id, name, email, role, label, department, avatar FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'The authenticated user session is no longer valid.'
      });
    }

    req.user = result.rows[0];
    req.user.permissions = config.rolePermissions[req.user.role] || [];
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
}

function optionalAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.session_token) {
    token = req.cookies.session_token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    db.query('SELECT id, name, email, role, label, department, avatar FROM users WHERE id = $1', [decoded.userId])
      .then(result => {
        if (result.rows && result.rows.length > 0) {
          req.user = result.rows[0];
          req.user.permissions = config.rolePermissions[req.user.role] || [];
        }
        next();
      })
      .catch(() => next());
  } catch (err) {
    next();
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`
      });
    }

    next();
  };
}

function requirePermission(moduleId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required.'
      });
    }

    const permissions = config.rolePermissions[req.user.role] || [];
    if (!permissions.includes(moduleId)) {
      return res.status(403).json({
        status: 'error',
        code: 'MODULE_ACCESS_DENIED',
        message: `Your persona (${req.user.role}) does not have permission to access the '${moduleId}' module.`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission
};
