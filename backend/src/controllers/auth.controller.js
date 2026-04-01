const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

// Returns { role, faction, hasCharacter } from user row + active character
function buildUserPayload(u) {
  return {
    id:           u.id,
    email:        u.email,
    username:     u.username,
    role:         u.role,
    faction:      u.char_faction || null,   // derived from active character
    hasCharacter: !!u.active_character_id,  // true once any character exists
  };
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.username, u.role, u.password_hash, u.is_active,
            u.active_character_id, sc.faction AS char_faction
     FROM users u
     LEFT JOIN spire_characters sc ON sc.id = u.active_character_id
     WHERE u.email = $1 AND u.is_active = true`,
    [email.toLowerCase().trim()]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'ACCESS DENIED' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'ACCESS DENIED' });

  const payload = buildUserPayload(user);
  const token = jwt.sign(
    { sub: payload.id, role: payload.role, username: payload.username, faction: payload.faction },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: payload });
}

async function me(req, res) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.username, u.role, u.created_at,
            u.active_character_id, sc.faction AS char_faction
     FROM users u
     LEFT JOIN spire_characters sc ON sc.id = u.active_character_id
     WHERE u.id = $1 AND u.is_active = true`,
    [req.user.sub]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { ...buildUserPayload(rows[0]), createdAt: rows[0].created_at } });
}

async function register(req, res) {
  const { email, password, username } = req.body;
  if (!email || !password || !username)
    return res.status(400).json({ error: 'email, password, username required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Passphrase must be at least 6 characters' });

  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows: [user] } = await pool.query(
      `INSERT INTO users (email, password_hash, username, role)
       VALUES ($1, $2, $3, 'guest') RETURNING id, email, username, role`,
      [email.toLowerCase().trim(), hash, username.trim()]
    );

    const payload = { id: user.id, email: user.email, username: user.username, role: user.role, faction: null };
    const token = jwt.sign(
      { sub: payload.id, role: payload.role, username: payload.username, faction: null },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: payload });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    throw err;
  }
}

module.exports = { login, me, register };
