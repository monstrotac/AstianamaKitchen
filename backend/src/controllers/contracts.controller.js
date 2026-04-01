const pool = require('../config/db');

// Game-elevated: admin role OR solstice faction (in-universe leader)
const isElevated  = (role, faction) => role === 'admin' || faction === 'solstice';
const isPrivileged = role => role === 'admin';

function canAccessContract(user, contract) {
  return isElevated(user.role, user.faction) ||
    user.faction === 'patron' ||
    contract.created_by === user.sub ||
    contract.assigned_to === user.sub;
}

// Who sees the full registry
function seesAllContracts(user) {
  return isElevated(user.role, user.faction) || user.faction === 'patron';
}

async function listContracts(req, res) {
  let query, params;
  if (seesAllContracts(req.user)) {
    query = `SELECT c.*,
               u1.username as created_by_name, sc1.faction as created_by_faction,
               u2.username as assigned_to_name, sc2.faction as assigned_to_faction,
               cs.gardener_name as assigned_to_gardener_name
             FROM contracts c
             LEFT JOIN users u1 ON u1.id = c.created_by
             LEFT JOIN spire_characters sc1 ON sc1.id = u1.active_character_id
             LEFT JOIN users u2 ON u2.id = c.assigned_to
             LEFT JOIN spire_characters sc2 ON sc2.id = u2.active_character_id
             LEFT JOIN character_sheets cs ON cs.user_id = c.assigned_to
             ORDER BY c.created_at DESC`;
    params = [];
  } else {
    query = `SELECT c.*,
               u1.username as created_by_name, sc1.faction as created_by_faction,
               u2.username as assigned_to_name, sc2.faction as assigned_to_faction,
               cs.gardener_name as assigned_to_gardener_name
             FROM contracts c
             LEFT JOIN users u1 ON u1.id = c.created_by
             LEFT JOIN spire_characters sc1 ON sc1.id = u1.active_character_id
             LEFT JOIN users u2 ON u2.id = c.assigned_to
             LEFT JOIN spire_characters sc2 ON sc2.id = u2.active_character_id
             LEFT JOIN character_sheets cs ON cs.user_id = c.assigned_to
             WHERE c.assigned_to = $1 OR c.created_by = $1
             ORDER BY c.created_at DESC`;
    params = [req.user.sub];
  }
  const { rows } = await pool.query(query, params);
  res.json(rows);
}

async function createContract(req, res) {
  const { name, classification, priority, status, method, weapon,
          notes_briefing, notes_intel, notes_exec, notes_exfil, assigned_to, is_public } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const { rows: [c] } = await pool.query(
    `INSERT INTO contracts
       (name, classification, priority, status, method, weapon,
        notes_briefing, notes_intel, notes_exec, notes_exfil,
        created_by, assigned_to, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [name, classification||'—', priority||'Standard', status||'active', method||'Unspecified',
     weapon||null, notes_briefing||null, notes_intel||null, notes_exec||null, notes_exfil||null,
     req.user.sub, assigned_to||null, is_public||false]
  );
  res.status(201).json(c);
}

async function getContract(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT c.*,
       u1.username as created_by_name,
       u2.username as assigned_to_name,
       cs.gardener_name as assigned_to_gardener_name
     FROM contracts c
     LEFT JOIN users u1 ON u1.id = c.created_by
     LEFT JOIN users u2 ON u2.id = c.assigned_to
     LEFT JOIN character_sheets cs ON cs.user_id = c.assigned_to
     WHERE c.id = $1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Contract not found' });
  if (!canAccessContract(req.user, rows[0]))
    return res.status(403).json({ error: 'Insufficient clearance' });
  res.json(rows[0]);
}

async function updateContract(req, res) {
  const { id } = req.params;
  const { rows: [existing] } = await pool.query('SELECT * FROM contracts WHERE id=$1', [id]);
  if (!existing) return res.status(404).json({ error: 'Contract not found' });
  if (!canAccessContract(req.user, existing))
    return res.status(403).json({ error: 'Insufficient clearance' });

  const fields = ['name','classification','priority','status','method','weapon',
                  'notes_briefing','notes_intel','notes_exec','notes_exfil','is_public'];
  // Elevated users (solstice/admin) can reassign
  if (isElevated(req.user.role, req.user.faction)) fields.push('assigned_to');

  const updates = ['updated_at=NOW()'];
  const values  = [];
  let i = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f}=$${i++}`); values.push(req.body[f]); }
  }
  values.push(id);
  const { rows: [c] } = await pool.query(
    `UPDATE contracts SET ${updates.join(',')} WHERE id=$${i} RETURNING *`,
    values
  );
  res.json(c);
}

async function closeContract(req, res) {
  const { id } = req.params;
  if (req.user.faction === 'patron')
    return res.status(403).json({ error: 'Patrons cannot close contracts' });
  const { rows: [existing] } = await pool.query('SELECT * FROM contracts WHERE id=$1', [id]);
  if (!existing) return res.status(404).json({ error: 'Contract not found' });
  if (!canAccessContract(req.user, existing))
    return res.status(403).json({ error: 'Insufficient clearance' });

  const { closed_approach, closed_method, closed_notes } = req.body;
  const { rows: [c] } = await pool.query(
    `UPDATE contracts SET
       status='complete', closed_approach=$1, closed_method=$2, closed_notes=$3,
       closed_date=CURRENT_DATE, updated_at=NOW()
     WHERE id=$4 RETURNING *`,
    [closed_approach||null, closed_method||null, closed_notes||null, id]
  );
  res.json(c);
}

async function deleteContract(req, res) {
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM contracts WHERE id=$1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'Contract not found' });
  res.json({ ok: true });
}

async function activeFeed(req, res) {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.classification, c.priority, c.status, c.method, c.weapon, c.created_at,
            u2.username as assigned_to_name, sc2.faction as assigned_to_faction
     FROM contracts c
     LEFT JOIN users u2 ON u2.id = c.assigned_to
     LEFT JOIN spire_characters sc2 ON sc2.id = u2.active_character_id
     WHERE c.status = 'active'
     ORDER BY c.created_at DESC`
  );
  res.json(rows);
}

async function completeFeed(req, res) {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.classification, c.priority, c.status, c.method,
            c.closed_approach, c.closed_date, c.closed_notes,
            u2.username as assigned_to_name, sc2.faction as assigned_to_faction
     FROM contracts c
     LEFT JOIN users u2 ON u2.id = c.assigned_to
     LEFT JOIN spire_characters sc2 ON sc2.id = u2.active_character_id
     WHERE c.status = 'complete'
     ORDER BY c.closed_date DESC NULLS LAST, c.created_at DESC`
  );
  res.json(rows);
}

module.exports = { listContracts, createContract, getContract, updateContract, closeContract, deleteContract, activeFeed, completeFeed };
