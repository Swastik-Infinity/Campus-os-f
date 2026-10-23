/**
 * CampusOS v1.2 — Assets Register Routes
 */
const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assets.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, requireRole('staff', 'admin'), assetsController.getAllAssets);
router.get('/:id', authenticate, requireRole('staff', 'admin'), assetsController.getAssetById);

module.exports = router;
