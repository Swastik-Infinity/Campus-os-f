/**
 * CampusOS v1.2 — Smart Notices Controller
 */
const db = require('../../database/db');

function generateNoticeId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NT-${rand}`;
}

const noticesController = {
  // Get all notices according to audience visibility
  getAllNotices: async (req, res, next) => {
    try {
      const user = req.user;
      const { priority, query: search } = req.query;

      let sql = 'SELECT id, title, content, audience, priority, expiry, read_by as "readBy", created_at as "created" FROM notices WHERE 1=1';
      const params = [];

      // Audience filtering: students see only general and student announcements
      if (user.role === 'student') {
        sql += " AND audience IN ('ALL', 'CE-Student')";
      }

      if (priority && priority !== 'all') {
        params.push(priority === 'important' ? 'Important' : priority);
        sql += ` AND priority = $${params.length}`;
      }

      if (search) {
        params.push(`%${search.toLowerCase()}%`);
        sql += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(content) LIKE $${params.length})`;
      }

      sql += ' ORDER BY created_at DESC, id DESC';

      const result = await db.query(sql, params);
      res.json({
        status: 'success',
        count: result.rows.length,
        notices: result.rows
      });
    } catch (err) {
      next(err);
    }
  },

  // Publish official notice (Admin)
  publishNotice: async (req, res, next) => {
    try {
      const { title, content, audience, priority, expiry } = req.body;
      const noticeId = generateNoticeId();
      const today = new Date().toISOString().slice(0, 10);

      await db.transaction(async (client) => {
        await client.query(
          `INSERT INTO notices (id, title, content, audience, priority, expiry, read_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, '[]'::jsonb, $7)`,
          [noticeId, title, content, audience, priority, expiry, today]
        );

        // Broadcast notification
        await client.query(
          `INSERT INTO notifications (id, user_id, title, message, target_module, unread)
           VALUES ($1, NULL, $2, $3, 'notices', TRUE)`,
          [`NOTIF-${Date.now()}`, `Official Notice: ${title}`, `Important announcement published for ${audience}.`]
        );
      });

      const newNotice = {
        id: noticeId,
        title,
        content,
        audience,
        priority,
        expiry,
        readBy: [],
        created: today
      };

      res.status(201).json({
        status: 'success',
        message: 'Notice published successfully',
        notice: newNotice
      });
    } catch (err) {
      next(err);
    }
  },

  // Toggle read / unread status
  toggleRead: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const noticeRes = await db.query('SELECT read_by FROM notices WHERE id = $1', [id]);
      if (!noticeRes.rows || noticeRes.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'NOTICE_NOT_FOUND',
          message: `Notice '${id}' was not found.`
        });
      }

      let readBy = noticeRes.rows[0].read_by || [];
      if (typeof readBy === 'string') {
        try { readBy = JSON.parse(readBy); } catch (e) { readBy = []; }
      }

      const isRead = readBy.includes(user.id);
      if (isRead) {
        readBy = readBy.filter(uId => uId !== user.id);
      } else {
        readBy.push(user.id);
      }

      await db.query('UPDATE notices SET read_by = $1 WHERE id = $2', [JSON.stringify(readBy), id]);

      res.json({
        status: 'success',
        noticeId: id,
        isRead: !isRead,
        readBy
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = noticesController;
