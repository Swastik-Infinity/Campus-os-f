/**
 * CampusOS v1.2 — Assets Register Controller
 */
const db = require('../../database/db');

const assetsController = {
  getAllAssets: async (req, res, next) => {
    try {
      const result = await db.query(
        'SELECT id, name, category, location, installed_date as "installed", condition, repairs, complaints, specs FROM assets ORDER BY id ASC'
      );
      res.json({
        status: 'success',
        count: result.rows.length,
        assets: result.rows
      });
    } catch (err) {
      next(err);
    }
  },

  getAssetById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await db.query(
        'SELECT id, name, category, location, installed_date as "installed", condition, repairs, complaints, specs FROM assets WHERE id = $1',
        [id]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'ASSET_NOT_FOUND',
          message: `Asset '${id}' was not found.`
        });
      }

      res.json({
        status: 'success',
        asset: result.rows[0]
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = assetsController;
