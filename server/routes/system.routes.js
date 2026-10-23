/**
 * CampusOS v1.2 — System Routes
 */
const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/health', systemController.getHealth);
router.post('/reset', authenticate, requireRole('admin'), systemController.resetDemo);

module.exports = router;
