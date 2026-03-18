const router = require('express').Router();
const pool   = require('../config/db');

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM codex_articles ORDER BY sort_order ASC`
  );
  res.json(rows);
});

module.exports = router;
