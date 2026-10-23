/**
 * CampusOS v1.2 — Department Inventory Routes
 */
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { adjustInventorySchema } = require('../validators');

router.get('/', authenticate, requireRole('staff', 'admin'), inventoryController.getAllInventory);
router.patch('/:id/adjust', authenticate, requireRole('staff', 'admin'), validate(adjustInventorySchema), inventoryController.adjustStock);

module.exports = router;
