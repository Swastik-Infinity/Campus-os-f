/**
 * CampusOS v1.2 — Smart Attendance Routes
 */
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { rosterAttendanceSchema, updateThresholdSchema } = require('../validators');

router.get('/', authenticate, attendanceController.getAttendance);
router.post('/roster', authenticate, requireRole('faculty', 'admin'), validate(rosterAttendanceSchema), attendanceController.saveRosterAttendance);
router.patch('/threshold', authenticate, requireRole('faculty', 'admin'), validate(updateThresholdSchema), attendanceController.updateThreshold);

module.exports = router;
