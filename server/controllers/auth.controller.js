/**
 * CampusOS v1.2 — Authentication Controller
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const config = require('../config');

function createToken(userId, role) {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

function setAuthCookie(res, token) {
  res.cookie('session_token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

const authController = {
  // Demo persona login
  demoLogin: async (req, res, next) => {
    try {
      const { accountId } = req.body;
      const result = await db.query(
        'SELECT id, name, email, role, label, department, avatar FROM users WHERE id = $1',
        [accountId]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'ACCOUNT_NOT_FOUND',
          message: `Demo persona '${accountId}' was not found.`
        });
      }

      const user = result.rows[0];
      const token = createToken(user.id, user.role);
      setAuthCookie(res, token);

      res.json({
        status: 'success',
        message: `Authenticated as ${user.name}`,
        token,
        user: {
          ...user,
          permissions: config.rolePermissions[user.role] || []
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Production email/password login
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await db.query(
        'SELECT id, name, email, password_hash, role, label, department, avatar FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        });
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        });
      }

      const token = createToken(user.id, user.role);
      setAuthCookie(res, token);

      const { password_hash, ...safeUser } = user;
      res.json({
        status: 'success',
        message: 'Login successful',
        token,
        user: {
          ...safeUser,
          permissions: config.rolePermissions[user.role] || []
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Current session inspection
  me: async (req, res, next) => {
    try {
      res.json({
        status: 'success',
        user: req.user
      });
    } catch (err) {
      next(err);
    }
  },

  // Logout & session clearance
  logout: async (req, res, next) => {
    try {
      res.clearCookie('session_token');
      res.json({
        status: 'success',
        message: 'Successfully signed out.'
      });
    } catch (err) {
      next(err);
    }
  },

  // Get demo accounts list for persona switcher modal
  getDemoAccounts: async (req, res, next) => {
    try {
      const result = await db.query(
        "SELECT id, name, role, label, department, avatar FROM users WHERE id IN ('student-kiran', 'faculty-neha', 'staff-arun', 'admin-campus') ORDER BY CASE role WHEN 'student' THEN 1 WHEN 'faculty' THEN 2 WHEN 'staff' THEN 3 WHEN 'admin' THEN 4 END"
      );
      res.json({
        status: 'success',
        accounts: result.rows
      });
    } catch (err) {
      next(err);
    }
  },

  // Get student class roster
  getRoster: async (req, res, next) => {
    try {
      const result = await db.query(
        'SELECT u.id, u.name, sp.roll_no as roll, sp.division as div FROM users u JOIN student_profiles sp ON u.id = sp.user_id ORDER BY sp.roll_no'
      );
      res.json({
        status: 'success',
        roster: result.rows
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
