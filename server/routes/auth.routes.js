/**
 * CampusOS v1.2 — Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, demoLoginSchema } = require('../validators');

router.post('/demo-login', validate(demoLoginSchema), authController.demoLogin);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.get('/accounts', authController.getDemoAccounts);
router.get('/roster', authenticate, authController.getRoster);

module.exports = router;
