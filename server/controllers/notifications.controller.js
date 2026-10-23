/**
 * CampusOS v1.2 — Notifications Controller
 */
const db = require('../../database/db');

const notificationsController = {
  getAllNotifications: async (req, res, next) => {
    try {
      const user = req.user;
      const result = await db.query(
        'SELECT id, title, message, target_module as "targetModule", unread, created_at as "time" FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 20',
        [user.id]
      );

      // Human readable relative times
      const formatted = result.rows.map(n => {
        const diffMs = Date.now() - new Date(n.time).getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        let timeLabel = 'Just now';
        if (diffHrs >= 24) {
          timeLabel = `${Math.floor(diffHrs / 24)} day(s) ago`;
        } else if (diffHrs >= 1) {
          timeLabel = `${diffHrs} hour(s) ago`;
        } else if (diffMs > 60000) {
          timeLabel = `${Math.floor(diffMs / 60000)} min ago`;
        }
        return {
          ...n,
          unread: Boolean(n.unread),
          time: timeLabel
        };
      });

      res.json({
        status: 'success',
        notifications: formatted,
        unreadCount: formatted.filter(n => n.unread).length
      });
    } catch (err) {
      next(err);
    }
  },

  markAllRead: async (req, res, next) => {
    try {
      const user = req.user;
      await db.query(
        'UPDATE notifications SET unread = FALSE WHERE user_id = $1 OR user_id IS NULL',
        [user.id]
      );
      res.json({
        status: 'success',
        message: 'All notifications marked as read.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = notificationsController;
