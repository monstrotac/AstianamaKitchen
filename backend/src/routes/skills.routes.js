const router = require('express').Router();
const auth   = require('../middleware/auth');
const pool   = require('../config/db');

router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT skill_name, default_bonus, display_order FROM skills_reference ORDER BY display_order`
  );
  res.json(rows);
});

module.exports = router;
