const pool = require('../config/db');

const RANK_ORDER = ['acolyte', 'apprentice', 'lord', 'darth'];

function requireSpireRank(minRank) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    try {
      const { rows } = await pool.query(
        'SELECT spire_rank FROM spire_characters WHERE user_id=$1',
        [req.user.sub]
      );
      if (!rows[0]) return res.status(403).json({ error: 'No Sanctum character found. Create your character first.' });
      const userIdx     = RANK_ORDER.indexOf(rows[0].spire_rank);
      const requiredIdx = RANK_ORDER.indexOf(minRank);
      if (userIdx < requiredIdx) {
        return res.status(403).json({ error: `Requires ${minRank} rank or above` });
      }
      req.spireRank = rows[0].spire_rank;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requireSpireRank;
