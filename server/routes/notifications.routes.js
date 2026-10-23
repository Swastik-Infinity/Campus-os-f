/**
 * CampusOS v1.2 — Notifications Routes
 */
const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, notificationsController.getAllNotifications);
router.post('/mark-all-read', authenticate, notificationsController.markAllRead);

module.exports = router;
