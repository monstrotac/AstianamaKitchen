const pool = require('../config/db');

async function getRolls(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT cr.*, u.username as rolled_by_name
     FROM contract_rolls cr
     JOIN users u ON u.id = cr.rolled_by
     WHERE cr.contract_id = $1
     ORDER BY cr.rolled_at ASC`,
    [id]
  );
  res.json(rows);
}

async function addRoll(req, res) {
  const { id } = req.params;
  const { situation, skill_name, skill_bonus, dc, die1, die2, modifier, total, outcome, margin, damage_tier } = req.body;
  if (!situation || !skill_name || dc == null || die1 == null || die2 == null)
    return res.status(400).json({ error: 'situation, skill_name, dc, die1, die2 required' });

  const { rows: [r] } = await pool.query(
    `INSERT INTO contract_rolls
       (contract_id, rolled_by, situation, skill_name, skill_bonus, dc, die1, die2, modifier, total, outcome, margin, damage_tier)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [id, req.user.sub, situation, skill_name, skill_bonus, dc, die1, die2, modifier, total, outcome, margin ?? null, damage_tier ?? null]
  );
  res.status(201).json(r);
}

async function deleteRoll(req, res) {
  const { rid } = req.params;
  const { rowCount } = await pool.query('DELETE FROM contract_rolls WHERE id=$1', [rid]);
  if (!rowCount) return res.status(404).json({ error: 'Roll not found' });
  res.json({ ok: true });
}

module.exports = { getRolls, addRoll, deleteRoll };
