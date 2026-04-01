const bcrypt = require('bcrypt');
const pool   = require('../config/db');

const isPrivileged = (role, faction) => role === 'admin' || faction === 'solstice';

async function listUsers(req, res) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.username, u.role, u.is_active, u.created_at,
            u.operative_name, u.active_character_id,
            sc.faction AS char_faction, sc.spire_rank, sc.character_name AS char_name
     FROM users u
     LEFT JOIN spire_characters sc ON sc.id = u.active_character_id
     ORDER BY u.created_at ASC`
  );
  res.json(rows.map(u => ({
    id: u.id, email: u.email, username: u.username,
    operativeName: u.operative_name || null,
    activeCharId: u.active_character_id || null,
    faction: u.char_faction || null,
    spireRank: u.spire_rank || null,
    charName: u.char_name || null,
    role: u.role, isActive: u.is_active, createdAt: u.created_at,
  })));
}

async function createUser(req, res) {
  const { email, password, username } = req.body;
  if (!email || !password || !username)
    return res.status(400).json({ error: 'email, password, username required' });

  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows: [user] } = await pool.query(
      `INSERT INTO users (email, password_hash, username, role)
       VALUES ($1, $2, $3, 'user') RETURNING id, email, username, role, created_at`,
      [email.toLowerCase().trim(), hash, username]
    );
    res.status(201).json({ id: user.id, email: user.email, username: user.username, role: user.role });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    throw err;
  }
}

async function getUser(req, res) {
  const { id } = req.params;
  if (!isPrivileged(req.user.role, req.user.faction) && req.user.sub !== id)
    return res.status(403).json({ error: 'Insufficient clearance' });

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.username, u.role, u.is_active, u.created_at,
            cs.id as sheet_id, cs.species, cs.alignment, cs.specialties, cs.bio, cs.base_modifier
     FROM users u
     LEFT JOIN character_sheets cs ON cs.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  const u = rows[0];
  res.json({
    id: u.id, email: u.email, username: u.username,
    role: u.role, isActive: u.is_active, createdAt: u.created_at,
    sheet: { id: u.sheet_id, species: u.species, alignment: u.alignment, specialties: u.specialties, bio: u.bio, base_modifier: u.base_modifier }
  });
}

async function updateUser(req, res) {
  const { id } = req.params;
  if (!isPrivileged(req.user.role, req.user.faction) && req.user.sub !== id)
    return res.status(403).json({ error: 'Insufficient clearance' });

  const updates = [];
  const values  = [];
  let i = 1;

  if (req.body.username !== undefined) { updates.push(`username=$${i++}`); values.push(req.body.username); }
  if (req.body.email    !== undefined) { updates.push(`email=$${i++}`);     values.push(req.body.email.toLowerCase().trim()); }
  // Only admins can change role, active status, and operative name
  if (isPrivileged(req.user.role, req.user.faction)) {
    if (req.body.operativeName !== undefined) { updates.push(`operative_name=$${i++}`); values.push(req.body.operativeName || null); }
    if (req.body.role !== undefined) {
      const validRoles = ['guest', 'user', 'admin'];
      if (!validRoles.includes(req.body.role)) return res.status(400).json({ error: 'Invalid role' });
      updates.push(`role=$${i++}`); values.push(req.body.role);
    }
    if (req.body.isActive  !== undefined) { updates.push(`is_active=$${i++}`);  values.push(req.body.isActive); }
    if (req.body.password  !== undefined) {
      const hash = await bcrypt.hash(req.body.password, 12);
      updates.push(`password_hash=$${i++}`);
      values.push(hash);
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE users SET ${updates.join(',')} WHERE id=$${i} RETURNING id, email, username, role, is_active`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  const u = rows[0];
  res.json({ id: u.id, email: u.email, username: u.username, role: u.role, isActive: u.is_active });
}

async function getSheet(req, res) {
  const { id } = req.params;
  if (!isPrivileged(req.user.role, req.user.faction) && req.user.sub !== id)
    return res.status(403).json({ error: 'Insufficient clearance' });

  const { rows } = await pool.query(
    `SELECT cs.*, u.username
     FROM character_sheets cs JOIN users u ON u.id = cs.user_id
     WHERE cs.user_id = $1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Sheet not found' });
  res.json(rows[0]);
}

async function updateSheet(req, res) {
  const { id } = req.params;
  if (!isPrivileged(req.user.role, req.user.faction) && req.user.sub !== id)
    return res.status(403).json({ error: 'Insufficient clearance' });

  const fields = ['species','alignment','specialties','bio','base_modifier','gardener_name','name_origin'];
  const updates = [];
  const values  = [];
  let i = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f}=$${i++}`); values.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  updates.push(`updated_at=NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE character_sheets SET ${updates.join(',')} WHERE user_id=$${i} RETURNING *`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: 'Sheet not found' });
  res.json(rows[0]);
}

async function getSkills(req, res) {
  const { id } = req.params;
  if (!isPrivileged(req.user.role, req.user.faction) && req.user.sub !== id)
    return res.status(403).json({ error: 'Insufficient clearance' });

  const { rows: sheet } = await pool.query(
    `SELECT base_modifier FROM character_sheets WHERE user_id=$1`, [id]
  );
  const base_modifier = sheet[0]?.base_modifier ?? 3;

  const { rows } = await pool.query(
    `SELECT sr.skill_name,
            COALESCE(co.bonus, sr.default_bonus) AS bonus,
            sr.display_order
     FROM skills_reference sr
     LEFT JOIN character_skill_overrides co ON co.user_id=$1 AND co.skill_name=sr.skill_name
     ORDER BY sr.display_order`,
    [id]
  );
  res.json({ base_modifier, skills: rows });
}

async function updateSkills(req, res) {
  const { id } = req.params;
  if (!isPrivileged(req.user.role, req.user.faction) && req.user.sub !== id)
    return res.status(403).json({ error: 'Insufficient clearance' });

  const { overrides } = req.body; // [{ skill_name, bonus }]
  if (!Array.isArray(overrides)) return res.status(400).json({ error: 'overrides array required' });

  for (const { skill_name, bonus } of overrides) {
    await pool.query(
      `INSERT INTO character_skill_overrides (user_id, skill_name, bonus)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, skill_name) DO UPDATE SET bonus=$3`,
      [id, skill_name, bonus]
    );
  }
  res.json({ ok: true });
}

async function deleteUser(req, res) {
  const { id } = req.params;

  // Prevent self-deletion
  if (req.user.sub === id)
    return res.status(400).json({ error: 'Cannot delete your own account' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clean up tables that lack ON DELETE CASCADE on user FK
    // Contract rolls reference users(id) without cascade
    await client.query('DELETE FROM contract_rolls WHERE rolled_by=$1', [id]);
    // Contracts reference users(id) without cascade
    await client.query('UPDATE contracts SET assigned_to=NULL WHERE assigned_to=$1', [id]);
    await client.query('DELETE FROM contracts WHERE created_by=$1', [id]);

    // Everything else cascades automatically when the user row is deleted:
    // spire_characters (CASCADE) → spire_skills, character_stories, session_members, session_messages (all CASCADE)
    // rolling_sessions (CASCADE), character_sheets (CASCADE), character_skill_overrides (CASCADE)
    // trials.assigned_to/assigned_by (SET NULL), reports.author_id (SET NULL), events.author_id (SET NULL)

    const { rowCount } = await client.query('DELETE FROM users WHERE id=$1', [id]);
    if (!rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'User not found' }); }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { listUsers, createUser, getUser, updateUser, deleteUser, getSheet, updateSheet, getSkills, updateSkills };
