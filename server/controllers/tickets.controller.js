/**
 * CampusOS v1.2 — CampusFix Tickets Controller
 */
const db = require('../../database/db');

function generateTicketId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CF-${rand}`;
}

const ticketsController = {
  // List tickets with search and filters
  getAllTickets: async (req, res, next) => {
    try {
      const { status, category, urgency, query: search } = req.query;
      const user = req.user;

      let sql = 'SELECT id, owner_id as "ownerId", owner_name as "ownerName", assigned_to as "assignedTo", affected_count as "affectedCount", affected_by as "affectedBy", expected_hours as "expectedHours", title, category, location, urgency, description as "desc", status, created_at as "created", resolved_at as "resolved" FROM tickets WHERE 1=1';
      const params = [];

      // Role scoping: Staff sees their assigned tickets by default unless viewing all
      if (user.role === 'staff' && !req.query.all) {
        params.push(user.id);
        sql += ` AND assigned_to = $${params.length}`;
      }

      if (status && status !== 'ALL') {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }

      if (category && category !== 'ALL') {
        params.push(category);
        sql += ` AND category = $${params.length}`;
      }

      if (urgency && urgency !== 'ALL') {
        params.push(urgency);
        sql += ` AND urgency = $${params.length}`;
      }

      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        sql += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(location) LIKE $${params.length} OR LOWER(id) LIKE $${params.length})`;
      }

      sql += ' ORDER BY created_at DESC';

      const result = await db.query(sql, params);
      res.json({
        status: 'success',
        count: result.rows.length,
        tickets: result.rows
      });
    } catch (err) {
      next(err);
    }
  },

  // Get ticket details by ID
  getTicketById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await db.query(
        'SELECT id, owner_id as "ownerId", owner_name as "ownerName", assigned_to as "assignedTo", affected_count as "affectedCount", affected_by as "affectedBy", expected_hours as "expectedHours", title, category, location, urgency, description as "desc", status, created_at as "created", resolved_at as "resolved" FROM tickets WHERE id = $1',
        [id]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'TICKET_NOT_FOUND',
          message: `Ticket '${id}' was not found.`
        });
      }

      const historyResult = await db.query(
        'SELECT tsh.id, tsh.previous_status, tsh.new_status, tsh.notes, tsh.changed_at, u.name as changed_by_name FROM ticket_status_history tsh JOIN users u ON tsh.changed_by = u.id WHERE tsh.ticket_id = $1 ORDER BY tsh.changed_at ASC',
        [id]
      );

      res.json({
        status: 'success',
        ticket: result.rows[0],
        history: historyResult.rows
      });
    } catch (err) {
      next(err);
    }
  },

  // Create ticket
  createTicket: async (req, res, next) => {
    try {
      const { title, category, location, urgency, desc } = req.body;
      const user = req.user;

      const expectedHours = urgency === 'High' ? 24 : urgency === 'Medium' ? 72 : 120;
      const ticketId = generateTicketId();
      const defaultAssigned = 'staff-arun'; // Default auto-dispatch technician

      await db.transaction(async (client) => {
        // Insert ticket
        await client.query(
          `INSERT INTO tickets (id, owner_id, owner_name, assigned_to, affected_count, affected_by, expected_hours, title, category, location, urgency, description, status, created_at)
           VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8, $9, $10, $11, 'PENDING', CURRENT_TIMESTAMP)`,
          [ticketId, user.id, user.name, defaultAssigned, JSON.stringify([user.id]), expectedHours, title, category, location, urgency, desc || '']
        );

        // Insert initial history record
        await client.query(
          `INSERT INTO ticket_status_history (ticket_id, changed_by, previous_status, new_status, notes)
           VALUES ($1, $2, NULL, 'PENDING', 'Initial issue reported')`,
          [ticketId, user.id]
        );

        // Create notification for maintenance staff
        await client.query(
          `INSERT INTO notifications (id, user_id, title, message, target_module, unread)
           VALUES ($1, $2, $3, $4, $5, TRUE)`,
          [`NOTIF-${Date.now()}`, defaultAssigned, `New Ticket Dispatched (${ticketId})`, `${title} reported at ${location}`, 'campusfix']
        );
      });

      const createdTicket = {
        id: ticketId,
        ownerId: user.id,
        ownerName: user.name,
        assignedTo: defaultAssigned,
        affectedCount: 1,
        affectedBy: [user.id],
        expectedHours,
        title,
        category,
        location,
        urgency,
        desc: desc || '',
        status: 'PENDING',
        created: new Date().toISOString(),
        resolved: null
      };

      res.status(201).json({
        status: 'success',
        message: 'Ticket submitted successfully',
        ticket: createdTicket
      });
    } catch (err) {
      next(err);
    }
  },

  // Update ticket status
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user;

      const ticketResult = await db.query('SELECT status, owner_id, title FROM tickets WHERE id = $1', [id]);
      if (!ticketResult.rows || ticketResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'TICKET_NOT_FOUND',
          message: `Ticket '${id}' was not found.`
        });
      }

      const prevStatus = ticketResult.rows[0].status;
      const ownerId = ticketResult.rows[0].owner_id;
      const title = ticketResult.rows[0].title;
      const resolvedAt = status === 'RESOLVED' ? new Date().toISOString() : null;

      await db.transaction(async (client) => {
        await client.query(
          'UPDATE tickets SET status = $1, resolved_at = $2 WHERE id = $3',
          [status, resolvedAt, id]
        );

        await client.query(
          'INSERT INTO ticket_status_history (ticket_id, changed_by, previous_status, new_status, notes) VALUES ($1, $2, $3, $4, $5)',
          [id, user.id, prevStatus, status, `Status updated by ${user.name}`]
        );

        // Notify ticket owner
        await client.query(
          'INSERT INTO notifications (id, user_id, title, message, target_module, unread) VALUES ($1, $2, $3, $4, $5, TRUE)',
          [`NOTIF-${Date.now()}`, ownerId, `Ticket ${id} Status Changed`, `Your ticket '${title}' is now ${status.replace('_', ' ')}.`, 'campusfix']
        );
      });

      res.json({
        status: 'success',
        message: `Ticket status updated to ${status}`,
        ticketId: id,
        status,
        resolvedAt
      });
    } catch (err) {
      next(err);
    }
  },

  // Assign staff to ticket
  assignStaff: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { staffId } = req.body;

      let staffName = 'Unassigned';
      if (staffId) {
        const staffRes = await db.query("SELECT name FROM users WHERE id = $1 AND role IN ('staff', 'admin')", [staffId]);
        if (!staffRes.rows || staffRes.rows.length === 0) {
          return res.status(400).json({
            status: 'error',
            code: 'INVALID_STAFF',
            message: 'Selected staff member does not exist or lacks maintenance role.'
          });
        }
        staffName = staffRes.rows[0].name;
      }

      await db.query('UPDATE tickets SET assigned_to = $1 WHERE id = $2', [staffId || null, id]);

      res.json({
        status: 'success',
        message: staffId ? `Ticket assigned to ${staffName}` : 'Ticket marked as unassigned',
        ticketId: id,
        assignedTo: staffId || null
      });
    } catch (err) {
      next(err);
    }
  },

  // Endorse ticket ("I'm Affected Too")
  endorseTicket: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const ticketRes = await db.query('SELECT affected_by, affected_count FROM tickets WHERE id = $1', [id]);
      if (!ticketRes.rows || ticketRes.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'TICKET_NOT_FOUND',
          message: `Ticket '${id}' was not found.`
        });
      }

      let affectedBy = ticketRes.rows[0].affected_by || [];
      if (typeof affectedBy === 'string') {
        try { affectedBy = JSON.parse(affectedBy); } catch (e) { affectedBy = []; }
      }

      if (affectedBy.includes(user.id)) {
        return res.status(400).json({
          status: 'error',
          code: 'ALREADY_ENDORSED',
          message: 'You have already reported impact for this issue.',
          affectedCount: affectedBy.length
        });
      }

      affectedBy.push(user.id);
      const newCount = (ticketRes.rows[0].affected_count || 0) + 1;

      await db.query(
        'UPDATE tickets SET affected_by = $1, affected_count = $2 WHERE id = $3',
        [JSON.stringify(affectedBy), newCount, id]
      );

      res.json({
        status: 'success',
        message: 'Your impact has been registered to elevate ticket priority.',
        ticketId: id,
        affectedCount: newCount
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ticketsController;
