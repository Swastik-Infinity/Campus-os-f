/**
 * CampusOS v1.2 — Smart Attendance Controller
 */
const db = require('../../database/db');

const attendanceController = {
  // Get attendance overview
  getAttendance: async (req, res, next) => {
    try {
      const user = req.user;
      const targetStudentId = (req.query.studentId && ['faculty', 'admin'].includes(user.role))
        ? req.query.studentId
        : (user.role === 'student' ? user.id : 'student-kiran');

      // Get threshold setting
      const threshRes = await db.query(
        "SELECT threshold FROM attendance_settings WHERE department = 'Computer Engineering' LIMIT 1"
      );
      const threshold = threshRes.rows.length > 0 ? threshRes.rows[0].threshold : 75;

      // Get subjects for student
      const subjRes = await db.query(
        'SELECT name, attended, total FROM attendance_subjects WHERE student_id = $1 ORDER BY id ASC',
        [targetStudentId]
      );

      // Get recent logs
      const logRes = await db.query(
        'SELECT lecture_date as date, subject, status FROM attendance_logs WHERE student_id = $1 ORDER BY lecture_date DESC, id DESC LIMIT 15',
        [targetStudentId]
      );

      res.json({
        status: 'success',
        threshold,
        subjects: subjRes.rows,
        history: logRes.rows
      });
    } catch (err) {
      next(err);
    }
  },

  // Save batch attendance for roster (Faculty / Admin)
  saveRosterAttendance: async (req, res, next) => {
    try {
      const { subject, date, records } = req.body;

      await db.transaction(async (client) => {
        for (const rec of records) {
          const { studentId, status } = rec;

          // 1. Ensure subject record exists or update total & attended
          const isPresent = status === 'Present';
          const attendedIncr = isPresent ? 1 : 0;

          // Upsert subject record
          await client.query(
            `INSERT INTO attendance_subjects (student_id, name, attended, total)
             VALUES ($1, $2, $3, 1)
             ON CONFLICT (student_id, name)
             DO UPDATE SET total = attendance_subjects.total + 1,
                           attended = attendance_subjects.attended + $4`,
            [studentId, subject, attendedIncr, attendedIncr]
          );

          // 2. Insert into history log
          await client.query(
            'INSERT INTO attendance_logs (student_id, lecture_date, subject, status) VALUES ($1, $2, $3, $4)',
            [studentId, date, subject, status]
          );
        }
      });

      res.json({
        status: 'success',
        message: `Attendance recorded for ${records.length} students in ${subject}.`,
        subject,
        date,
        recordsProcessed: records.length
      });
    } catch (err) {
      next(err);
    }
  },

  // Update attendance threshold configuration
  updateThreshold: async (req, res, next) => {
    try {
      const { threshold } = req.body;
      await db.query(
        `INSERT INTO attendance_settings (department, threshold)
         VALUES ('Computer Engineering', $1)
         ON CONFLICT (department)
         DO UPDATE SET threshold = EXCLUDED.threshold, updated_at = CURRENT_TIMESTAMP`,
        [threshold]
      );

      res.json({
        status: 'success',
        message: `Institutional attendance threshold updated to ${threshold}%.`,
        threshold
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = attendanceController;
