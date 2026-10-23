/**
 * CampusOS v1.2 — Leave Management Routes
 */
const express = require('express');
const router = express.Router();
const leavesController = require('../controllers/leaves.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { applyLeaveSchema, updateLeaveStatusSchema } = require('../validators');

router.get('/', authenticate, leavesController.getAllLeaves);
router.get('/:id', authenticate, leavesController.getLeaveById);
router.post('/', authenticate, requireRole('student', 'admin'), validate(applyLeaveSchema), leavesController.applyLeave);
router.patch('/:id/status', authenticate, requireRole('faculty', 'admin'), validate(updateLeaveStatusSchema), leavesController.updateStatus);

module.exports = router;
