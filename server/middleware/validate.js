/**
 * CampusOS v1.2 — Zod Schema Request Validation Middleware
 */
const { ZodError } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message
        }));
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload or parameters.',
          errors: issues
        });
      }
      next(err);
    }
  };
}

module.exports = validate;
