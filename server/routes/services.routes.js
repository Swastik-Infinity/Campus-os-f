/**
 * CampusOS v1.2 — Student Services Routes
 */
const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createServiceSchema, updateServiceStatusSchema } = require('../validators');

router.get('/', authenticate, servicesController.getAllServices);
router.post('/', authenticate, requireRole('student', 'admin'), validate(createServiceSchema), servicesController.submitRequest);
router.patch('/:id/status', authenticate, requireRole('admin'), validate(updateServiceStatusSchema), servicesController.updateStatus);

module.exports = router;
