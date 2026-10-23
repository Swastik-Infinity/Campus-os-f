/**
 * CampusOS v1.2 — Department Inventory Controller
 */
const db = require('../../database/db');

const inventoryController = {
  getAllInventory: async (req, res, next) => {
    try {
      const { filter } = req.query;
      let sql = 'SELECT id, name, department, stock, min_stock as "min", unit FROM inventory_items';
      const params = [];

      if (filter === 'low') {
        sql += ' WHERE stock < min_stock';
      } else if (filter === 'healthy') {
        sql += ' WHERE stock >= min_stock';
      }

      sql += ' ORDER BY id ASC';

      const result = await db.query(sql, params);
      res.json({
        status: 'success',
        count: result.rows.length,
        inventory: result.rows
      });
    } catch (err) {
      next(err);
    }
  },

  adjustStock: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { delta } = req.body;
      const user = req.user;

      const itemRes = await db.query('SELECT name, stock, min_stock as "min", unit FROM inventory_items WHERE id = $1', [id]);
      if (!itemRes.rows || itemRes.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'ITEM_NOT_FOUND',
          message: `Inventory item '${id}' was not found.`
        });
      }

      const item = itemRes.rows[0];
      const newStock = Math.max(0, item.stock + delta);

      await db.transaction(async (client) => {
        await client.query(
          'UPDATE inventory_items SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStock, id]
        );

        // Audit log entry
        await client.query(
          `INSERT INTO audit_logs (user_id, action, details, ip_address)
           VALUES ($1, 'INVENTORY_ADJUST', $2, $3)`,
          [user.id, JSON.stringify({ itemId: id, itemName: item.name, previousStock: item.stock, newStock, delta }), req.ip || '127.0.0.1']
        );
      });

      res.json({
        status: 'success',
        message: 'Stock adjusted successfully',
        item: {
          id,
          name: item.name,
          stock: newStock,
          min: item.min,
          unit: item.unit
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = inventoryController;
