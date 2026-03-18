const pool = require('../config/db');
const path = require('path');
const fs   = require('fs');

const RANK_ORDER  = ['acolyte', 'apprentice', 'lord', 'darth'];
// System admin: can override ownership / see everything
const isPrivileged = (role, faction) => role === 'admin' || faction === 'solstice';

function canSee(visibility, user, spireRank) {
  if (visibility === 'public') return true;
  if (!user) return false;
  if (isPrivileged(user.role, user.faction)) return true;
  if (visibility.startsWith('role:')) {
    if (!spireRank) return false;
    const required    = visibility.split(':')[1];
    const userIdx     = RANK_ORDER.indexOf(spireRank);
    const requiredIdx = RANK_ORDER.indexOf(required);
    return userIdx >= requiredIdx && userIdx !== -1;
  }
  if (visibility.startsWith('user:')) {
    const target = visibility.split(':')[1].toLowerCase();
    return user.codeName?.toLowerCase() === target;
  }
  return false;
}

async function getUserSpireRank(userId) {
  if (!userId) return null;
  // Use active character's rank, or highest rank if no active character set
  const { rows } = await pool.query(
    `SELECT sc.spire_rank
     FROM users u
     LEFT JOIN spire_characters sc ON sc.id = u.active_character_id
     WHERE u.id = $1`,
    [userId]
  );
  if (rows[0]?.spire_rank) return rows[0].spire_rank;
  // Fallback: highest rank among user's characters
  const { rows: fallback } = await pool.query(
    `SELECT spire_rank FROM spire_characters WHERE user_id = $1
     ORDER BY ARRAY_POSITION(ARRAY['acolyte','apprentice','lord','darth'], spire_rank) DESC
     LIMIT 1`,
    [userId]
  );
  return fallback[0]?.spire_rank || null;
}

const CHAR_SELECT = `
  SELECT sc.*,
         u.code_name,
         mu.code_name AS master_code_name, mu.id AS master_user_id
  FROM spire_characters sc
  JOIN users u ON u.id = sc.user_id
  LEFT JOIN users mu ON mu.id = sc.master_id
`;

// ── Characters ────────────────────────────────────────────────────────────────

async function listCharacters(req, res) {
  const { search } = req.query;
  if (search) {
    const { rows } = await pool.query(
      `${CHAR_SELECT}
       WHERE u.is_active = true
         AND (LOWER(sc.character_name) LIKE LOWER($1) OR LOWER(u.code_name) LIKE LOWER($1))
       ORDER BY sc.created_at DESC
       LIMIT 20`,
      [`%${search}%`]
    );
    return res.json(rows);
  }
  const { rows } = await pool.query(
    `${CHAR_SELECT}
     WHERE u.is_active = true
     ORDER BY sc.created_at DESC`
  );
  res.json(rows);
}

async function listCharactersForUser(req, res) {
  const { userId } = req.params;
  const { rows } = await pool.query(
    `${CHAR_SELECT} WHERE sc.user_id = $1 ORDER BY sc.created_at ASC`,
    [userId]
  );
  res.json(rows);
}

async function listMyCharacters(req, res) {
  const userId = req.user.sub;
  const { rows } = await pool.query(
    `${CHAR_SELECT}
     WHERE sc.user_id = $1
     ORDER BY sc.created_at ASC`,
    [userId]
  );
  // Include which one is active
  const { rows: userRows } = await pool.query(
    'SELECT active_character_id FROM users WHERE id=$1', [userId]
  );
  res.json({ characters: rows, active_character_id: userRows[0]?.active_character_id || null });
}

async function getCharacter(req, res) {
  const { charId } = req.params;
  const { rows } = await pool.query(
    `${CHAR_SELECT} WHERE sc.id = $1`,
    [charId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Character not found' });
  res.json(rows[0]);
}

function validateAttrs(body) {
  const ATTR_KEYS = ['str', 'dex', 'con', 'int_score', 'wis', 'cha'];
  for (const key of ATTR_KEYS) {
    if (body[key] !== undefined) {
      const v = body[key];
      if (!Number.isInteger(v) || v < -2 || v > 5) {
        return `${key} must be an integer between -2 and 5`;
      }
    }
  }
  return null;
}

async function createCharacter(req, res) {
  const userId = req.user.sub;
  const {
    spire_rank, status_name, species, bio, master_id,
    str, dex, con, int_score, wis, cha,
    total_xp, spent_xp,
    character_name, full_name, quote, age, height,
    eye_color, hair_color, skin_color, tattoos_distinctions,
    alignment, homeworld, occupation, affiliation, relationship_status,
    likes, dislikes, biography, skills_narrative, weapons, gear,
  } = req.body;

  const attrError = validateAttrs(req.body);
  if (attrError) return res.status(400).json({ error: attrError });

  const { rows: [char] } = await pool.query(
    `INSERT INTO spire_characters
       (user_id, spire_rank, status_name, species, bio, master_id,
        str, dex, con, int_score, wis, cha, total_xp, spent_xp,
        character_name, full_name, quote, age, height,
        eye_color, hair_color, skin_color, tattoos_distinctions,
        alignment, homeworld, occupation, affiliation, relationship_status,
        likes, dislikes, biography, skills_narrative, weapons, gear)
     VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,
        $29,$30,$31,$32,$33,$34)
     RETURNING *`,
    [
      userId,
      spire_rank || 'acolyte',
      status_name || null, species || null, bio || null, master_id || null,
      str ?? 1, dex ?? 1, con ?? 1, int_score ?? 1, wis ?? 1, cha ?? 1,
      total_xp ?? 0, spent_xp ?? 0,
      character_name || null, full_name || null, quote || null,
      age || null, height || null,
      eye_color || null, hair_color || null, skin_color || null,
      tattoos_distinctions || null, alignment || null,
      homeworld || null, occupation || null, affiliation || null,
      relationship_status || null, likes || null, dislikes || null,
      biography || null, skills_narrative || null, weapons || null, gear || null,
    ]
  );

  // If this is the user's first character, set it as active
  const { rows: existing } = await pool.query(
    'SELECT active_character_id FROM users WHERE id=$1', [userId]
  );
  if (!existing[0]?.active_character_id) {
    await pool.query(
      'UPDATE users SET active_character_id=$1 WHERE id=$2',
      [char.id, userId]
    );
  }

  res.status(201).json(char);
}

async function updateCharacter(req, res) {
  const { charId } = req.params;
  const requesterId = req.user.sub;

  // Permission: own character, master, or solstice
  const { rows: charRows } = await pool.query(
    'SELECT user_id, master_id FROM spire_characters WHERE id=$1', [charId]
  );
  if (!charRows[0]) return res.status(404).json({ error: 'Character not found' });
  const char = charRows[0];

  if (!isPrivileged(req.user.role, req.user.faction) && requesterId !== char.user_id) {
    if (char.master_id !== requesterId) {
      return res.status(403).json({ error: 'Insufficient clearance' });
    }
  }

  const attrError = validateAttrs(req.body);
  if (attrError) return res.status(400).json({ error: attrError });

  const allowed = [
    'spire_rank','status_name','species','bio','master_id',
    'str','dex','con','int_score','wis','cha',
    'total_xp','spent_xp',
    'character_name','full_name','quote','age','height',
    'eye_color','hair_color','skin_color','tattoos_distinctions',
    'alignment','homeworld','occupation','affiliation','relationship_status',
    'likes','dislikes','biography','skills_narrative','weapons','gear',
  ];
  // Only privileged users (solstice/admin) may set faction and operative_name
  const privilegedAllowed = ['faction', 'operative_name'];
  if (isPrivileged(req.user.role, req.user.faction)) {
    allowed.push(...privilegedAllowed);
  }
  const updates = [];
  const values  = [];
  let i = 1;
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      updates.push(`${field}=$${i++}`);
      values.push(req.body[field]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  updates.push(`updated_at=NOW()`);
  values.push(charId);

  const { rows } = await pool.query(
    `UPDATE spire_characters SET ${updates.join(',')} WHERE id=$${i} RETURNING *`,
    values
  );
  res.json(rows[0]);
}

async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  const { charId } = req.params;

  const { rows } = await pool.query(
    'SELECT user_id FROM spire_characters WHERE id=$1', [charId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Character not found' });
  if (req.user.sub !== rows[0].user_id && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }

  const image_url = `/uploads/${req.file.filename}`;
  await pool.query(
    `UPDATE spire_characters SET image_url=$1, updated_at=NOW() WHERE id=$2`,
    [image_url, charId]
  );
  res.json({ image_url });
}

async function setActiveCharacter(req, res) {
  const userId = req.user.sub;
  const { charId } = req.body;

  if (charId) {
    const { rows } = await pool.query(
      'SELECT id FROM spire_characters WHERE id=$1 AND user_id=$2',
      [charId, userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Character not found or not yours' });
  }

  await pool.query(
    'UPDATE users SET active_character_id=$1 WHERE id=$2',
    [charId || null, userId]
  );
  res.json({ ok: true, active_character_id: charId || null });
}

// ── Skills ────────────────────────────────────────────────────────────────────

async function listSkills(req, res) {
  const { charId } = req.params;
  const { rows } = await pool.query(
    'SELECT skill_name, attribute, rank FROM spire_skills WHERE character_id=$1 ORDER BY id',
    [charId]
  );
  res.json(rows);
}

async function upsertSkills(req, res) {
  const { charId } = req.params;

  const { rows: charRows } = await pool.query(
    'SELECT user_id FROM spire_characters WHERE id=$1', [charId]
  );
  if (!charRows[0]) return res.status(404).json({ error: 'Character not found' });
  const charUserId = charRows[0].user_id;
  if (req.user.sub !== charUserId && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }

  const { skills } = req.body;
  if (!Array.isArray(skills)) return res.status(400).json({ error: 'skills array required' });

  for (const { skill_name, attribute, rank } of skills) {
    if (!skill_name) continue;
    const r = rank ?? 0;
    if (r === 0) {
      await pool.query(
        'DELETE FROM spire_skills WHERE character_id=$1 AND skill_name=$2',
        [charId, skill_name]
      );
    } else {
      await pool.query(
        `INSERT INTO spire_skills (character_id, user_id, skill_name, attribute, rank)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (character_id, skill_name)
           WHERE character_id IS NOT NULL
         DO UPDATE SET attribute=EXCLUDED.attribute, rank=EXCLUDED.rank`,
        [charId, charUserId, skill_name, attribute || null, r]
      );
    }
  }
  res.json({ ok: true });
}

async function deleteSkill(req, res) {
  const { charId, skillName } = req.params;

  const { rows: charRows } = await pool.query(
    'SELECT user_id FROM spire_characters WHERE id=$1', [charId]
  );
  if (!charRows[0]) return res.status(404).json({ error: 'Character not found' });
  if (req.user.sub !== charRows[0].user_id && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }

  await pool.query(
    'DELETE FROM spire_skills WHERE character_id=$1 AND skill_name=$2',
    [charId, decodeURIComponent(skillName)]
  );
  res.json({ ok: true });
}

// ── Descriptions ──────────────────────────────────────────────────────────────

async function getDescriptions(req, res) {
  const { rows } = await pool.query(
    'SELECT type, key, label, description FROM spire_descriptions ORDER BY type, key'
  );
  res.json(rows);
}

// ── Trials ────────────────────────────────────────────────────────────────────

async function listTrials(req, res) {
  const spireRank = req.user ? await getUserSpireRank(req.user.sub) : null;
  const { assigned_to } = req.query;
  const userId = req.user?.sub ?? null;
  const conditions = [];
  const params = [];
  let i = 1;

  // Show published OR own drafts
  if (userId) {
    conditions.push(`(t.is_published = TRUE OR t.assigned_by = $${i++})`);
    params.push(userId);
  } else {
    conditions.push(`t.is_published = TRUE`);
  }

  if (assigned_to) {
    conditions.push(`t.assigned_to = $${i++}`);
    params.push(assigned_to);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const { rows } = await pool.query(
    `SELECT t.*,
            u1.code_name AS assigned_to_name,
            u2.code_name AS assigned_by_name,
            sc.character_name AS creator_name, sc.image_url AS creator_image_url
     FROM trials t
     LEFT JOIN users u1 ON u1.id = t.assigned_to
     LEFT JOIN users u2 ON u2.id = t.assigned_by
     LEFT JOIN spire_characters sc ON sc.id = t.creator_character_id
     ${whereClause}
     ORDER BY t.created_at DESC`,
    params
  );

  const result = rows.map(trial => {
    if (canSee(trial.visibility, req.user, spireRank)) return trial;
    return {
      id:               trial.id,
      title:            trial.title,
      status:           trial.status,
      visibility:       trial.visibility,
      assigned_to_name: trial.assigned_to_name,
      assigned_by_name: trial.assigned_by_name,
      created_at:       trial.created_at,
      isLocked:         true,
    };
  });
  res.json(result);
}

async function createTrial(req, res) {
  // Creates immediately as draft — no required fields
  const { rows: [trial] } = await pool.query(
    `INSERT INTO trials (title, description, assigned_by, visibility, is_published)
     VALUES ('', NULL, $1, 'public', FALSE) RETURNING *`,
    [req.user.sub]
  );
  res.status(201).json(trial);
}

async function getTrial(req, res) {
  const spireRank = req.user ? await getUserSpireRank(req.user.sub) : null;
  const { rows } = await pool.query(
    `SELECT t.*,
            u1.code_name AS assigned_to_name,
            u2.code_name AS assigned_by_name
     FROM trials t
     LEFT JOIN users u1 ON u1.id = t.assigned_to
     LEFT JOIN users u2 ON u2.id = t.assigned_by
     WHERE t.id=$1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Trial not found' });
  const trial = rows[0];
  if (!canSee(trial.visibility, req.user, spireRank)) {
    return res.json({ id: trial.id, title: trial.title, status: trial.status,
      visibility: trial.visibility, isLocked: true });
  }
  res.json(trial);
}

async function deleteTrial(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT assigned_by FROM trials WHERE id=$1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Trial not found' });
  if (rows[0].assigned_by !== req.user.sub && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }
  await pool.query('DELETE FROM trials WHERE id=$1', [id]);
  res.json({ ok: true });
}

async function updateTrialStatus(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM trials WHERE id=$1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Trial not found' });
  const trial = rows[0];

  if (!isPrivileged(req.user.role, req.user.faction) && req.user.sub !== trial.assigned_by?.toString()) {
    return res.status(403).json({ error: 'Only the assigning master can update this trial' });
  }

  const { status, title, description, visibility, assigned_to, creator_character_id, is_published } = req.body;

  // Publishing requires a creator character
  if (is_published && !creator_character_id && !trial.creator_character_id) {
    return res.status(400).json({ error: 'A creator character is required before publishing' });
  }

  const allowed = [];
  const values  = [];
  let i = 1;
  if (status               !== undefined) { allowed.push(`status=$${i++}`);               values.push(status); }
  if (title                !== undefined) { allowed.push(`title=$${i++}`);                values.push(title); }
  if (description          !== undefined) { allowed.push(`description=$${i++}`);          values.push(description); }
  if (visibility           !== undefined) { allowed.push(`visibility=$${i++}`);           values.push(visibility); }
  if (assigned_to          !== undefined) { allowed.push(`assigned_to=$${i++}`);          values.push(assigned_to); }
  if (creator_character_id !== undefined) { allowed.push(`creator_character_id=$${i++}`); values.push(creator_character_id); }
  if (is_published         !== undefined) { allowed.push(`is_published=$${i++}`);         values.push(is_published); }
  if (!allowed.length) return res.status(400).json({ error: 'Nothing to update' });
  allowed.push(`updated_at=NOW()`);
  values.push(id);

  const { rows: [updated] } = await pool.query(
    `UPDATE trials SET ${allowed.join(',')} WHERE id=$${i} RETURNING *`, values
  );
  res.json(updated);
}

// ── Trial Entries ──────────────────────────────────────────────────────────────

async function listEntries(req, res) {
  const spireRank = req.user ? await getUserSpireRank(req.user.sub) : null;
  const { rows: trialRows } = await pool.query('SELECT visibility FROM trials WHERE id=$1', [req.params.id]);
  if (!trialRows[0]) return res.status(404).json({ error: 'Trial not found' });
  if (!canSee(trialRows[0].visibility, req.user, spireRank)) {
    return res.json([]);
  }
  const { rows } = await pool.query(
    `SELECT te.*, u.code_name AS author_name
     FROM trial_entries te
     LEFT JOIN users u ON u.id = te.author_id
     WHERE te.trial_id=$1
     ORDER BY te.created_at ASC`,
    [req.params.id]
  );
  res.json(rows);
}

async function addEntry(req, res) {
  const { id } = req.params;
  const { rows: [trial] } = await pool.query('SELECT * FROM trials WHERE id=$1', [id]);
  if (!trial) return res.status(404).json({ error: 'Trial not found' });

  const isAssignedTo = trial.assigned_to === req.user.sub;
  const isAssignedBy = trial.assigned_by === req.user.sub;
  if (!isAssignedTo && !isAssignedBy && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Only participants can add entries' });
  }

  const { body, entry_type, roll_data } = req.body;
  if (!body) return res.status(400).json({ error: 'body required' });

  const { rows: [entry] } = await pool.query(
    `INSERT INTO trial_entries (trial_id, author_id, body, entry_type, roll_data)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [id, req.user.sub, body, entry_type || 'narrative', roll_data ? JSON.stringify(roll_data) : null]
  );
  res.status(201).json(entry);
}

// ── Events ────────────────────────────────────────────────────────────────────

async function listEvents(req, res) {
  const spireRank = req.user ? await getUserSpireRank(req.user.sub) : null;
  const { rows } = await pool.query(
    `SELECT e.*, u.code_name AS author_name
     FROM events e
     LEFT JOIN users u ON u.id = e.author_id
     ORDER BY e.created_at DESC
     LIMIT 50`
  );
  const result = rows.map(event => {
    if (canSee(event.visibility, req.user, spireRank)) return event;
    return {
      id:          event.id,
      title:       event.title,
      visibility:  event.visibility,
      author_name: event.author_name,
      created_at:  event.created_at,
      isLocked:    true,
    };
  });
  res.json(result);
}

async function createEvent(req, res) {
  const { title, body, visibility } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const { rows: [event] } = await pool.query(
    `INSERT INTO events (author_id, title, body, visibility)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.sub, title, body, visibility || 'public']
  );
  res.status(201).json(event);
}

async function deleteEvent(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT author_id FROM events WHERE id=$1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Event not found' });
  if (rows[0].author_id !== req.user.sub && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }
  await pool.query('DELETE FROM events WHERE id=$1', [id]);
  res.json({ ok: true });
}

// ── Stories ────────────────────────────────────────────────────────────────

async function listStories(req, res) {
  const { charId } = req.params;
  const userId = req.user?.sub ?? null;

  let query;
  let params;

  if (userId) {
    // Check if viewer owns this character
    const { rows: charRows } = await pool.query(
      'SELECT user_id FROM spire_characters WHERE id=$1', [charId]
    );
    const isOwner = charRows[0]?.user_id === userId;
    const isPriv  = isPrivileged(req.user.role, req.user.faction);
    if (isOwner || isPriv) {
      // Show all (published + drafts)
      query = `SELECT * FROM character_stories WHERE character_id=$1 ORDER BY created_at DESC`;
      params = [charId];
    } else {
      query = `SELECT * FROM character_stories WHERE character_id=$1 AND is_published=TRUE ORDER BY created_at DESC`;
      params = [charId];
    }
  } else {
    query = `SELECT * FROM character_stories WHERE character_id=$1 AND is_published=TRUE ORDER BY created_at DESC`;
    params = [charId];
  }

  const { rows } = await pool.query(query, params);
  res.json(rows);
}

async function getStory(req, res) {
  const { charId, storyId } = req.params;
  const { rows } = await pool.query(
    `SELECT cs.*, u.code_name AS author_name, sc.character_name
     FROM character_stories cs
     LEFT JOIN users u ON u.id = cs.user_id
     LEFT JOIN spire_characters sc ON sc.id = cs.character_id
     WHERE cs.id=$1 AND cs.character_id=$2`,
    [storyId, charId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Story not found' });
  const story = rows[0];
  if (!story.is_published) {
    const userId = req.user?.sub ?? null;
    if (userId !== story.user_id && !isPrivileged(req.user?.role, req.user?.faction)) {
      return res.status(403).json({ error: 'Insufficient clearance' });
    }
  }
  res.json(story);
}

async function createStory(req, res) {
  const { charId } = req.params;

  const { rows: charRows } = await pool.query(
    'SELECT user_id FROM spire_characters WHERE id=$1', [charId]
  );
  if (!charRows[0]) return res.status(404).json({ error: 'Character not found' });
  const charUserId = charRows[0].user_id;

  if (req.user.sub !== charUserId && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }

  // Creates as draft — no required fields
  const { rows: [story] } = await pool.query(
    `INSERT INTO character_stories (user_id, character_id, title, body, visibility, is_published)
     VALUES ($1,$2,'','','public',FALSE) RETURNING *`,
    [charUserId, charId]
  );
  res.status(201).json(story);
}

async function updateStory(req, res) {
  const { charId, storyId } = req.params;

  const { rows: charRows } = await pool.query(
    'SELECT user_id FROM spire_characters WHERE id=$1', [charId]
  );
  if (!charRows[0]) return res.status(404).json({ error: 'Character not found' });

  if (req.user.sub !== charRows[0].user_id && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }

  const { rows: storyRows } = await pool.query(
    'SELECT * FROM character_stories WHERE id=$1 AND character_id=$2', [storyId, charId]
  );
  if (!storyRows[0]) return res.status(404).json({ error: 'Story not found' });

  const { title, body, visibility, is_published } = req.body;

  // Publishing requires non-empty title and body
  if (is_published) {
    const effectiveTitle = title ?? storyRows[0].title;
    const effectiveBody  = body  ?? storyRows[0].body;
    if (!effectiveTitle?.trim() || !effectiveBody?.trim()) {
      return res.status(400).json({ error: 'Title and body are required before publishing' });
    }
  }

  const setClauses = [];
  const values = [];
  let i = 1;
  if (title        !== undefined) { setClauses.push(`title=$${i++}`);        values.push(title); }
  if (body         !== undefined) { setClauses.push(`body=$${i++}`);         values.push(body); }
  if (visibility   !== undefined) { setClauses.push(`visibility=$${i++}`);   values.push(visibility); }
  if (is_published !== undefined) { setClauses.push(`is_published=$${i++}`); values.push(is_published); }
  if (!setClauses.length) return res.status(400).json({ error: 'Nothing to update' });
  setClauses.push(`updated_at=NOW()`);
  values.push(storyId);

  const { rows: [updated] } = await pool.query(
    `UPDATE character_stories SET ${setClauses.join(',')} WHERE id=$${i} RETURNING *`,
    values
  );
  res.json(updated);
}

async function deleteStory(req, res) {
  const { charId, storyId } = req.params;

  const { rows: charRows } = await pool.query(
    'SELECT user_id FROM spire_characters WHERE id=$1', [charId]
  );
  if (!charRows[0]) return res.status(404).json({ error: 'Character not found' });

  if (req.user.sub !== charRows[0].user_id && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }

  const { rowCount } = await pool.query(
    'DELETE FROM character_stories WHERE id=$1 AND character_id=$2',
    [storyId, charId]
  );
  if (!rowCount) return res.status(404).json({ error: 'Story not found' });
  res.json({ ok: true });
}

async function listRecentStories(req, res) {
  const userId = req.user?.sub ?? null;
  const { rows } = await pool.query(
    `SELECT cs.*, u.code_name AS author_name,
            sc.character_name, sc.image_url AS char_image_url
     FROM character_stories cs
     LEFT JOIN users u ON u.id = cs.user_id
     LEFT JOIN spire_characters sc ON sc.id = cs.character_id
     WHERE (
       (cs.visibility = 'public' AND cs.is_published = TRUE AND cs.title <> '' AND cs.body <> '')
       ${userId ? `OR cs.user_id = $1` : ''}
     )
     ORDER BY cs.is_published ASC, cs.created_at DESC
     LIMIT 40`,
    userId ? [userId] : []
  );
  res.json(rows);
}

async function getActivityFeed(req, res) {
  const [charsRes, trialsRes, storiesRes] = await Promise.all([
    pool.query(
      `SELECT sc.id, sc.character_name AS title, NULL AS body, 'public' AS visibility, sc.created_at,
              u.code_name AS author_name, 'character' AS feed_type, NULL AS subject,
              NULL AS status, sc.user_id,
              sc.full_name, u.code_name AS username
       FROM spire_characters sc
       JOIN users u ON u.id = sc.user_id
       WHERE u.is_active = true
       ORDER BY sc.created_at DESC LIMIT 20`
    ),
    pool.query(
      `SELECT t.id, t.title, t.description AS body, 'public' AS visibility, t.created_at,
              u.code_name AS author_name, 'trial' AS feed_type, NULL AS subject,
              t.status, t.assigned_to AS user_id
       FROM trials t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.visibility = 'public'
         AND t.is_published = TRUE
         AND t.title <> ''
       ORDER BY t.created_at DESC LIMIT 20`
    ),
    pool.query(
      `SELECT cs.id, cs.title, cs.body, cs.visibility, cs.created_at,
              u.code_name AS author_name, 'story' AS feed_type, NULL AS subject,
              NULL AS status, cs.user_id, cs.character_id
       FROM character_stories cs
       LEFT JOIN users u ON u.id = cs.user_id
       WHERE cs.visibility = 'public'
         AND cs.is_published = TRUE
         AND cs.title <> ''
         AND cs.body  <> ''
       ORDER BY cs.created_at DESC LIMIT 20`
    ),
  ]);

  const allItems = [
    ...charsRes.rows,
    ...trialsRes.rows,
    ...storiesRes.rows,
  ];

  allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(allItems.slice(0, 30));
}

// ── Reports ────────────────────────────────────────────────────────────────

async function listReports(req, res) {
  const { subject, published_only } = req.query;
  const userId = req.user?.sub ?? null;
  const conditions = [];
  const params = [];
  let i = 1;

  // Show published OR own drafts (unless published_only=true)
  if (published_only === 'true' || !userId) {
    conditions.push(`r.is_published = TRUE`);
  } else {
    conditions.push(`(r.is_published = TRUE OR r.author_id = $${i++})`);
    params.push(userId);
  }

  if (subject) {
    conditions.push(`LOWER(r.subject) LIKE LOWER($${i++})`);
    params.push(`%${subject}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT r.*, u.code_name AS author_name,
            sc.character_name AS creator_name, sc.image_url AS creator_image_url
     FROM reports r
     LEFT JOIN users u ON u.id = r.author_id
     LEFT JOIN spire_characters sc ON sc.id = r.creator_character_id
     ${where}
     ORDER BY r.created_at DESC LIMIT 100`,
    params
  );
  res.json(rows);
}

async function getReport(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT r.*, u.code_name AS author_name,
            sc.character_name AS creator_name, sc.image_url AS creator_image_url
     FROM reports r
     LEFT JOIN users u ON u.id = r.author_id
     LEFT JOIN spire_characters sc ON sc.id = r.creator_character_id
     WHERE r.id = $1`,
    [id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Report not found' });
  const report = rows[0];
  // Draft: only author or privileged can view
  if (!report.is_published) {
    const userId = req.user?.sub ?? null;
    if (userId !== report.author_id && !isPrivileged(req.user?.role, req.user?.faction)) {
      return res.status(403).json({ error: 'Insufficient clearance' });
    }
  }
  res.json(report);
}

async function createReport(req, res) {
  // Creates immediately as draft — no required fields
  const { rows: [report] } = await pool.query(
    `INSERT INTO reports (author_id, subject, title, body, is_published)
     VALUES ($1, '', '', '', FALSE) RETURNING *`,
    [req.user.sub]
  );
  res.status(201).json(report);
}

async function updateReport(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM reports WHERE id=$1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Report not found' });
  const report = rows[0];

  if (report.author_id !== req.user.sub && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }

  const { subject, title, body, creator_character_id, is_published } = req.body;

  // Publishing requires a creator character
  if (is_published && !creator_character_id && !report.creator_character_id) {
    return res.status(400).json({ error: 'A creator character is required before publishing' });
  }

  const setClauses = [];
  const values = [];
  let i = 1;
  if (subject      !== undefined) { setClauses.push(`subject=$${i++}`);               values.push(subject); }
  if (title        !== undefined) { setClauses.push(`title=$${i++}`);                 values.push(title); }
  if (body         !== undefined) { setClauses.push(`body=$${i++}`);                  values.push(body); }
  if (creator_character_id !== undefined) { setClauses.push(`creator_character_id=$${i++}`); values.push(creator_character_id); }
  if (is_published !== undefined) { setClauses.push(`is_published=$${i++}`);          values.push(is_published); }
  if (!setClauses.length) return res.status(400).json({ error: 'Nothing to update' });
  setClauses.push(`updated_at=NOW()`);
  values.push(id);

  const { rows: [updated] } = await pool.query(
    `UPDATE reports SET ${setClauses.join(',')} WHERE id=$${i} RETURNING *`,
    values
  );
  res.json(updated);
}

async function deleteReport(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT author_id FROM reports WHERE id=$1', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Report not found' });
  if (rows[0].author_id !== req.user.sub && !isPrivileged(req.user.role, req.user.faction)) {
    return res.status(403).json({ error: 'Insufficient clearance' });
  }
  await pool.query('DELETE FROM reports WHERE id=$1', [id]);
  res.json({ ok: true });
}

module.exports = {
  listCharacters, listMyCharacters, listCharactersForUser, getCharacter,
  createCharacter, updateCharacter, uploadImage, setActiveCharacter,
  listSkills, upsertSkills, deleteSkill,
  getDescriptions,
  listTrials, createTrial, getTrial, updateTrialStatus, deleteTrial,
  listEntries, addEntry,
  listEvents, createEvent, deleteEvent,
  listStories, getStory, createStory, updateStory, deleteStory, listRecentStories,
  listReports, getReport, createReport, updateReport, deleteReport,
  getActivityFeed,
};
