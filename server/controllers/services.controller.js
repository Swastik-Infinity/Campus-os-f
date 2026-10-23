/**
 * CampusOS v1.2 — Student Services Controller
 */
const db = require('../../database/db');

function generateServiceId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SR-${rand}`;
}

const servicesController = {
  // Get all services
  getAllServices: async (req, res, next) => {
    try {
      const user = req.user;
      let sql = 'SELECT id, student_id as "studentId", student_name as "student", service_type as "type", details, status, request_date as "date", created_at as "created" FROM service_requests';
      const params = [];

      if (user.role === 'student') {
        params.push(user.id);
        sql += ' WHERE student_id = $1';
      }

      sql += ' ORDER BY created_at DESC';

      const result = await db.query(sql, params);
      res.json({
        status: 'success',
        count: result.rows.length,
        services: result.rows
      });
    } catch (err) {
      next(err);
    }
  },

  // Submit service request (Student)
  submitRequest: async (req, res, next) => {
    try {
      const { type, details } = req.body;
      const user = req.user;
      const serviceId = generateServiceId();
      const today = new Date().toISOString().slice(0, 10);

      await db.query(
        `INSERT INTO service_requests (id, student_id, student_name, service_type, details, status, request_date)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)`,
        [serviceId, user.id, user.name, type, details, today]
      );

      const newService = {
        id: serviceId,
        studentId: user.id,
        student: user.name,
        type,
        details,
        status: 'PENDING',
        date: today
      };

      res.status(201).json({
        status: 'success',
        message: 'Service request submitted successfully',
        service: newService
      });
    } catch (err) {
      next(err);
    }
  },

  // Update request status (Admin)
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await db.query(
        'UPDATE service_requests SET status = $1 WHERE id = $2 RETURNING id, status',
        [status, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'SERVICE_NOT_FOUND',
          message: `Service request '${id}' was not found.`
        });
      }

      res.json({
        status: 'success',
        message: `Service request status changed to ${status}`,
        serviceId: id,
        status
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = servicesController;
