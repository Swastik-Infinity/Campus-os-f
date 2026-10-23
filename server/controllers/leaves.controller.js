/**
 * CampusOS v1.2 — Leave Management Controller
 */
const db = require('../../database/db');

function generateLeaveId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LV-${rand}`;
}

const leavesController = {
  // Get leaves
  getAllLeaves: async (req, res, next) => {
    try {
      const user = req.user;
      let sql = 'SELECT id, student_id as "studentId", student_name as "student", start_date as "start", end_date as "end", days, reason, document, status, notes, created_at as "created" FROM leave_applications';
      const params = [];

      // Students only see their own leave requests
      if (user.role === 'student') {
        params.push(user.id);
        sql += ' WHERE student_id = $1';
      }

      sql += ' ORDER BY created_at DESC';

      const result = await db.query(sql, params);
      res.json({
        status: 'success',
        count: result.rows.length,
        leaves: result.rows
      });
    } catch (err) {
      next(err);
    }
  },

  // Get leave by ID
  getLeaveById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const result = await db.query(
        'SELECT id, student_id as "studentId", student_name as "student", start_date as "start", end_date as "end", days, reason, document, status, notes, created_at as "created" FROM leave_applications WHERE id = $1',
        [id]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'LEAVE_NOT_FOUND',
          message: `Leave application '${id}' was not found.`
        });
      }

      const leave = result.rows[0];
      if (user.role === 'student' && leave.studentId !== user.id) {
        return res.status(403).json({
          status: 'error',
          code: 'FORBIDDEN',
          message: 'You are not authorized to view this leave application.'
        });
      }

      res.json({
        status: 'success',
        leave
      });
    } catch (err) {
      next(err);
    }
  },

  // Apply for leave (Student)
  applyLeave: async (req, res, next) => {
    try {
      const { start, end, reason, document } = req.body;
      const user = req.user;

      const startDate = new Date(start);
      const endDate = new Date(end);
      const days = Math.max(1, Math.round((endDate - startDate) / 86400000) + 1);
      const leaveId = generateLeaveId();

      await db.transaction(async (client) => {
        await client.query(
          `INSERT INTO leave_applications (id, student_id, student_name, start_date, end_date, days, reason, document, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', '')`,
          [leaveId, user.id, user.name, start, end, days, reason, document || '']
        );

        // Notify faculty
        await client.query(
          `INSERT INTO notifications (id, user_id, title, message, target_module, unread)
           VALUES ($1, 'faculty-neha', 'New Student Leave Filed', $2, 'leave', TRUE)`,
          [`NOTIF-${Date.now()}`, `${user.name} applied for ${days} day(s) leave (${start} to ${end}).`]
        );
      });

      const newLeave = {
        id: leaveId,
        studentId: user.id,
        student: user.name,
        start,
        end,
        days,
        reason,
        document: document || '',
        status: 'PENDING',
        notes: ''
      };

      res.status(201).json({
        status: 'success',
        message: 'Leave application submitted successfully',
        leave: newLeave
      });
    } catch (err) {
      next(err);
    }
  },

  // Update leave status (Faculty / Admin)
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const user = req.user;

      const leaveRes = await db.query(
        'SELECT student_id, student_name FROM leave_applications WHERE id = $1',
        [id]
      );

      if (!leaveRes.rows || leaveRes.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'LEAVE_NOT_FOUND',
          message: `Leave application '${id}' was not found.`
        });
      }

      const { student_id: studentId } = leaveRes.rows[0];
      const resolvedNotes = notes || `Processed by ${user.name}`;

      await db.transaction(async (client) => {
        await client.query(
          'UPDATE leave_applications SET status = $1, notes = $2, reviewed_by = $3 WHERE id = $4',
          [status, resolvedNotes, user.id, id]
        );

        // Notify student of decision
        await client.query(
          `INSERT INTO notifications (id, user_id, title, message, target_module, unread)
           VALUES ($1, $2, 'Leave Application Status Update', $3, 'leave', TRUE)`,
          [`NOTIF-${Date.now()}`, studentId, `Your leave application ${id} status is now ${status}.`]
        );
      });

      res.json({
        status: 'success',
        message: `Leave application marked as ${status}.`,
        leaveId: id,
        status,
        notes: resolvedNotes
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = leavesController;
