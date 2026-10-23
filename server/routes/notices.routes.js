/**
 * CampusOS v1.2 — Smart Notices Routes
 */
const express = require('express');
const router = express.Router();
const noticesController = require('../controllers/notices.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createNoticeSchema } = require('../validators');

router.get('/', authenticate, noticesController.getAllNotices);
router.post('/', authenticate, requireRole('admin'), validate(createNoticeSchema), noticesController.publishNotice);
router.post('/:id/toggle-read', authenticate, requireRole('student'), noticesController.toggleRead);

module.exports = router;
