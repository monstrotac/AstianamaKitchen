const pool = require('../config/db');

// GET /api/sessions — list active sessions with member counts
async function listSessions(req, res) {
  const { rows } = await pool.query(`
    SELECT s.id, s.name, s.created_by, s.created_at,
           u.username AS creator_name,
           (SELECT COUNT(*) FROM session_members m WHERE m.session_id = s.id) AS member_count
    FROM rolling_sessions s
    JOIN users u ON u.id = s.created_by
    WHERE s.is_active = true
    ORDER BY s.created_at DESC
  `);
  res.json(rows);
}

// POST /api/sessions — create a new session
async function createSession(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Session name is required' });

  const { rows } = await pool.query(
    `INSERT INTO rolling_sessions (name, created_by) VALUES ($1, $2) RETURNING *`,
    [name.trim(), req.user.sub]
  );
  res.status(201).json(rows[0]);
}

// GET /api/sessions/:id — session details + members
async function getSession(req, res) {
  const { id } = req.params;

  const session = await pool.query(
    `SELECT s.*, u.username AS creator_name
     FROM rolling_sessions s JOIN users u ON u.id = s.created_by
     WHERE s.id = $1`, [id]
  );
  if (!session.rows.length) return res.status(404).json({ error: 'Session not found' });

  const members = await pool.query(
    `SELECT m.user_id, m.character_id, m.joined_at, m.current_hp,
            u.username, c.character_name, c.image_url, c.faction,
            c.str, c.dex, c.sta, c.cha, c.man, c.app, c.per, c.int_score, c.wit,
            c.armor
     FROM session_members m
     JOIN users u ON u.id = m.user_id
     JOIN spire_characters c ON c.id = m.character_id
     WHERE m.session_id = $1
     ORDER BY m.joined_at`, [id]
  );

  // Attach skills to each member
  if (members.rows.length) {
    const charIds = members.rows.map(m => m.character_id);
    const { rows: allSkills } = await pool.query(
      `SELECT character_id, skill_name, attribute, rank
       FROM spire_skills WHERE character_id = ANY($1)`, [charIds]
    );
    for (const m of members.rows) {
      m.skills = allSkills.filter(s => s.character_id === m.character_id);
    }
  }

  res.json({ ...session.rows[0], members: members.rows });
}

// POST /api/sessions/:id/join — join a session with a character
async function joinSession(req, res) {
  const { id } = req.params;
  const { characterId } = req.body;
  if (!characterId) return res.status(400).json({ error: 'characterId is required' });

  // Validate session exists and is active
  const sess = await pool.query('SELECT id FROM rolling_sessions WHERE id = $1 AND is_active = true', [id]);
  if (!sess.rows.length) return res.status(404).json({ error: 'Session not found' });

  // Validate character belongs to the user and get STA for HP calc
  const char = await pool.query('SELECT id, sta FROM spire_characters WHERE id = $1 AND user_id = $2', [characterId, req.user.sub]);
  if (!char.rows.length) return res.status(403).json({ error: 'Character does not belong to you' });

  // Compute max HP: 2 + STA + Resilience rank
  const sta = char.rows[0].sta ?? 0;
  const resSkill = await pool.query(
    `SELECT rank FROM spire_skills WHERE character_id = $1 AND skill_name = 'Resilience'`, [characterId]
  );
  const resRank = resSkill.rows[0]?.rank ?? 0;
  const maxHp = Math.max(2, 3 + sta + resRank);

  try {
    await pool.query(
      `INSERT INTO session_members (session_id, user_id, character_id, current_hp) VALUES ($1, $2, $3, $4)`,
      [id, req.user.sub, characterId, maxHp]
    );
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already in this session' });
    throw err;
  }
  res.status(201).json({ ok: true });
}

// POST /api/sessions/:id/leave — leave a session
async function leaveSession(req, res) {
  const { id } = req.params;
  await pool.query('DELETE FROM session_members WHERE session_id = $1 AND user_id = $2', [id, req.user.sub]);
  res.json({ ok: true });
}

// DELETE /api/sessions/:id — delete session (creator or admin)
async function deleteSession(req, res) {
  const { id } = req.params;
  const sess = await pool.query('SELECT created_by FROM rolling_sessions WHERE id = $1', [id]);
  if (!sess.rows.length) return res.status(404).json({ error: 'Session not found' });

  if (sess.rows[0].created_by !== req.user.sub && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the creator or an admin can delete this session' });
  }

  await pool.query('DELETE FROM rolling_sessions WHERE id = $1', [id]);
  res.json({ ok: true });
}

module.exports = { listSessions, createSession, getSession, joinSession, leaveSession, deleteSession };
