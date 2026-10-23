/**
 * CampusOS v1.2 — CampusFix Tickets Routes
 */
const express = require('express');
const router = express.Router();
const ticketsController = require('../controllers/tickets.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema
} = require('../validators');

router.get('/', authenticate, ticketsController.getAllTickets);
router.get('/:id', authenticate, ticketsController.getTicketById);
router.post('/', authenticate, requireRole('student', 'admin'), validate(createTicketSchema), ticketsController.createTicket);
router.patch('/:id/status', authenticate, requireRole('staff', 'admin'), validate(updateTicketStatusSchema), ticketsController.updateStatus);
router.patch('/:id/assign', authenticate, requireRole('admin'), validate(assignTicketSchema), ticketsController.assignStaff);
router.post('/:id/endorse', authenticate, requireRole('student'), ticketsController.endorseTicket);

module.exports = router;
