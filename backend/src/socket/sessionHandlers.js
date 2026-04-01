const pool = require('../config/db');

// ── Constants ────────────────────────────────────────────────────────────────
const ARMOR_SOAK = { unarmored: 0, light: 1, medium: 2, heavy: 3 };
const ARMOR_DODGE_PENALTY = { unarmored: 0, light: 0, medium: -2, heavy: -4 };
const MELEE_SKILLS = ['Brawl', 'Melee', 'Lightsabers'];

// Condition modifier definitions (mirrored from frontend/src/data/conditions.js)
const CONDITIONS = {
  prone:           { ownAttack: -2, meleeDefenseBonus: -2, rangedDefenseBonus: 2 },
  stunned:         { cantAct: true, allDefense: -4 },
  disarmed:        { cantUseWeapon: true },
  grappled:        { ownAttack: -2, noDodge: true },
  blinded:         { ownAttack: -4, dodgeBonus: -2 },
  immobilized:     { dodgeBonus: -2 },
  frightened:      { allRolls: -2 },
  slowed:          { dodgeBonus: -2 },
  mind_controlled: {},
  wounded:         { allRolls: -2 },
};

// Heal count tracker (in-memory, resets on server restart)
const healCounts = new Map();

// ── Server-side 2d10 roll logic ──────────────────────────────────────────────
function performRoll(modifier, dc, isCombat) {
  const d1 = Math.floor(Math.random() * 10) + 1;
  const d2 = Math.floor(Math.random() * 10) + 1;
  const total = d1 + d2 + modifier;

  let outcome, margin = null, damageTier = null;

  if (d1 === 10 && d2 === 10) {
    outcome = 'crit_success';
    margin = total - dc;
    damageTier = { label: 'Devastating', damage: 4 };
  } else if (d1 === 1 && d2 === 1) {
    outcome = 'crit_failure';
  } else if (total >= dc) {
    outcome = 'success';
    margin = total - dc;
    if (isCombat) {
      if (margin <= 3)      damageTier = { label: 'Glancing', damage: 1 };
      else if (margin <= 6) damageTier = { label: 'Solid', damage: 2 };
      else if (margin <= 9) damageTier = { label: 'Hard', damage: 3 };
      else                  damageTier = { label: 'Devastating', damage: 4 };
    }
  } else {
    outcome = 'failure';
  }

  return { die1: d1, die2: d2, modifier, total, dc, outcome, margin, damageTier };
}

// ── Load enriched members with combat data ───────────────────────────────────
async function loadEnrichedMembers(sessionId) {
  const { rows: members } = await pool.query(
    `SELECT m.user_id, m.character_id, m.current_hp, m.conditions,
            u.username, c.character_name, c.image_url, c.faction,
            c.str, c.dex, c.sta, c.cha, c.man, c.app, c.per, c.int_score, c.wit,
            c.armor
     FROM session_members m
     JOIN users u ON u.id = m.user_id
     JOIN spire_characters c ON c.id = m.character_id
     WHERE m.session_id = $1
     ORDER BY m.joined_at`, [sessionId]
  );

  if (members.length === 0) return members;

  const charIds = members.map(m => m.character_id);
  const { rows: allSkills } = await pool.query(
    `SELECT character_id, skill_name, attribute, rank
     FROM spire_skills WHERE character_id = ANY($1)`, [charIds]
  );

  for (const m of members) {
    m.skills = allSkills.filter(s => s.character_id === m.character_id);
    if (!Array.isArray(m.conditions)) m.conditions = [];
  }

  return members;
}

// ── Compute defense DC with condition modifiers ──────────────────────────────
async function computeTargetDefenseDC(targetMember, defenseType, attackSkill) {
  const { rows } = await pool.query(
    `SELECT attribute_key, skill_name, skill_multiplier FROM combat_ability_definitions
     WHERE name = $1 AND type = 'defense'`, [defenseType]
  );
  if (!rows.length) return null;

  const formula = rows[0];
  const attrMod = targetMember[formula.attribute_key] ?? 1;
  let bonus = attrMod;

  if (formula.skill_name) {
    const sk = targetMember.skills?.find(s => s.skill_name === formula.skill_name);
    bonus += (sk?.rank ?? 0) * (formula.skill_multiplier ?? 2);
  }

  if (defenseType === 'Dodge') {
    bonus += ARMOR_DODGE_PENALTY[targetMember.armor] || 0;
  }

  // Condition modifiers
  const conditions = targetMember.conditions || [];
  for (const cid of conditions) {
    const cond = CONDITIONS[cid];
    if (!cond) continue;
    if (cond.allDefense) bonus += cond.allDefense;
    if (defenseType === 'Dodge' && cond.dodgeBonus) bonus += cond.dodgeBonus;
    if (defenseType === 'Dodge' && cond.noDodge) return { dc: 0, bonus: 0, blocked: true, reason: 'Cannot Dodge while Grappled' };
  }

  // Prone: melee attackers easier to hit (DC-2), ranged harder (DC+2)
  if (conditions.includes('prone') && attackSkill) {
    if (MELEE_SKILLS.includes(attackSkill)) {
      bonus -= 2;
    } else {
      bonus += 2;
    }
  }

  return { dc: 10 + bonus, bonus };
}

// ── Apply attacker condition modifiers to attack roll ─────────────────────────
function applyAttackerConditions(baseModifier, attackerConditions) {
  let mod = baseModifier;
  for (const cid of (attackerConditions || [])) {
    const cond = CONDITIONS[cid];
    if (!cond) continue;
    if (cond.ownAttack) mod += cond.ownAttack;
    if (cond.allRolls) mod += cond.allRolls;
  }
  return mod;
}

// ── Compute max HP ───────────────────────────────────────────────────────────
function computeMaxHp(member) {
  const sta = member.sta ?? 1;
  const resilience = member.skills?.find(s => s.skill_name === 'Resilience');
  const resRank = resilience?.rank ?? 0;
  return Math.max(2, 2 + sta + resRank);
}

// ── Auto-manage Wounded condition based on HP ────────────────────────────────
async function autoManageWounded(io, sessionId, targetUserId, newHp) {
  const { rows } = await pool.query(
    'SELECT conditions FROM session_members WHERE session_id = $1 AND user_id = $2',
    [sessionId, targetUserId]
  );
  if (!rows.length) return;

  let conditions = Array.isArray(rows[0].conditions) ? rows[0].conditions : [];
  const hasWounded = conditions.includes('wounded');
  let changed = false;

  if (newHp <= 1 && newHp > 0 && !hasWounded) {
    conditions = [...conditions, 'wounded'];
    changed = true;
  } else if (newHp > 1 && hasWounded) {
    conditions = conditions.filter(c => c !== 'wounded');
    changed = true;
  }

  if (changed) {
    await pool.query(
      'UPDATE session_members SET conditions = $1 WHERE session_id = $2 AND user_id = $3',
      [JSON.stringify(conditions), sessionId, targetUserId]
    );
    io.to(`session:${sessionId}`).emit('session:conditions-update', { targetUserId, conditions });
  }
}

// ── Apply damage + broadcast ─────────────────────────────────────────────────
async function applyDamage(io, sessionId, targetUserId, damage, members) {
  const target = members.find(m => m.user_id === targetUserId);
  if (!target || damage <= 0) return;

  const { rows: hpRows } = await pool.query(
    `UPDATE session_members SET current_hp = GREATEST(0, current_hp - $1)
     WHERE session_id = $2 AND user_id = $3 RETURNING current_hp`,
    [damage, sessionId, targetUserId]
  );
  const newHp = hpRows[0]?.current_hp ?? 0;
  const maxHp = computeMaxHp(target);

  io.to(`session:${sessionId}`).emit('session:hp-update', {
    targetUserId, newHp, maxHp,
    characterName: target.character_name,
    hpChange: -damage,
  });

  await autoManageWounded(io, sessionId, targetUserId, newHp);
}

// ── Apply healing + broadcast ────────────────────────────────────────────────
async function applyHealing(io, sessionId, targetUserId, amount, members) {
  const target = members.find(m => m.user_id === targetUserId);
  if (!target || amount <= 0) return;

  const maxHp = computeMaxHp(target);
  const { rows: hpRows } = await pool.query(
    `UPDATE session_members SET current_hp = LEAST($1, current_hp + $2)
     WHERE session_id = $3 AND user_id = $4 RETURNING current_hp`,
    [maxHp, amount, sessionId, targetUserId]
  );
  const newHp = hpRows[0]?.current_hp ?? 0;

  io.to(`session:${sessionId}`).emit('session:hp-update', {
    targetUserId, newHp, maxHp,
    characterName: target.character_name,
    hpChange: amount,
  });

  await autoManageWounded(io, sessionId, targetUserId, newHp);
}

// ── Add condition to any member ──────────────────────────────────────────────
async function addConditionToMember(io, sessionId, targetUserId, conditionId) {
  const { rows } = await pool.query(
    'SELECT conditions FROM session_members WHERE session_id = $1 AND user_id = $2',
    [sessionId, targetUserId]
  );
  if (!rows.length) return;

  let conditions = Array.isArray(rows[0].conditions) ? rows[0].conditions : [];
  if (conditions.includes(conditionId)) return;

  conditions = [...conditions, conditionId];
  await pool.query(
    'UPDATE session_members SET conditions = $1 WHERE session_id = $2 AND user_id = $3',
    [JSON.stringify(conditions), sessionId, targetUserId]
  );

  io.to(`session:${sessionId}`).emit('session:conditions-update', { targetUserId, conditions });
}

// ── Get character name helper ────────────────────────────────────────────────
async function getCharName(sessionId, userId) {
  const { rows } = await pool.query(
    `SELECT c.character_name FROM session_members m
     JOIN spire_characters c ON c.id = m.character_id
     WHERE m.session_id = $1 AND m.user_id = $2`, [sessionId, userId]
  );
  return rows[0]?.character_name || 'Unknown';
}

// ═════════════════════════════════════════════════════════════════════════════
module.exports = function registerSessionHandlers(io, socket) {
  const joinedRooms = new Set();
  const pendingAttacks = new Map();

  // ── JOIN ────────────────────────────────────────────────────────────────────
  socket.on('session:join', async ({ sessionId }) => {
    try {
      const { rows: memberRows } = await pool.query(
        'SELECT character_id FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, socket.user.sub]
      );
      if (!memberRows.length) return socket.emit('session:error', { message: 'Not a member of this session' });

      const room = `session:${sessionId}`;
      socket.join(room);
      joinedRooms.add(sessionId);

      const { rows: messages } = await pool.query(
        `SELECT m.id, m.user_id, m.character_id, m.msg_type, m.content, m.roll_data, m.created_at,
                c.character_name, c.image_url, c.faction
         FROM session_messages m
         JOIN spire_characters c ON c.id = m.character_id
         WHERE m.session_id = $1
         ORDER BY m.created_at ASC
         LIMIT 100`, [sessionId]
      );
      socket.emit('session:history', messages);

      const members = await loadEnrichedMembers(sessionId);

      const { rows: charRows } = await pool.query(
        'SELECT character_name FROM spire_characters WHERE id = $1',
        [memberRows[0].character_id]
      );
      const charName = charRows[0]?.character_name || 'Unknown';

      socket.to(room).emit('session:user-joined', {
        user_id: socket.user.sub,
        username: socket.user.username,
        character_name: charName,
      });

      io.to(room).emit('session:members', members);
    } catch (err) {
      console.error('[Session:join]', err);
      socket.emit('session:error', { message: 'Failed to join session room' });
    }
  });

  // ── LEAVE ───────────────────────────────────────────────────────────────────
  socket.on('session:leave', async ({ sessionId }) => {
    const room = `session:${sessionId}`;
    socket.leave(room);
    joinedRooms.delete(sessionId);
    socket.to(room).emit('session:user-left', {
      user_id: socket.user.sub,
      username: socket.user.username,
    });
    try {
      const members = await loadEnrichedMembers(sessionId);
      io.to(room).emit('session:members', members);
    } catch {}
  });

  // ── CHAT ────────────────────────────────────────────────────────────────────
  socket.on('session:chat', async ({ sessionId, content }) => {
    if (!content || !content.trim()) return;
    try {
      const { rows: memberRows } = await pool.query(
        'SELECT character_id FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, socket.user.sub]
      );
      if (!memberRows.length) return;

      const characterId = memberRows[0].character_id;
      const { rows } = await pool.query(
        `INSERT INTO session_messages (session_id, user_id, character_id, msg_type, content)
         VALUES ($1, $2, $3, 'chat', $4) RETURNING *`,
        [sessionId, socket.user.sub, characterId, content.trim()]
      );

      const { rows: charRows } = await pool.query(
        'SELECT character_name, image_url, faction FROM spire_characters WHERE id = $1',
        [characterId]
      );

      io.to(`session:${sessionId}`).emit('session:message', {
        ...rows[0],
        character_name: charRows[0]?.character_name,
        image_url: charRows[0]?.image_url,
        faction: charRows[0]?.faction,
      });
    } catch (err) {
      console.error('[Session:chat]', err);
    }
  });

  // ── ROLL (non-targeted) ─────────────────────────────────────────────────────
  socket.on('session:roll', async ({ sessionId, modifier, dc, isCombat, skillLabel, rollType }) => {
    try {
      const { rows: memberRows } = await pool.query(
        'SELECT character_id FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, socket.user.sub]
      );
      if (!memberRows.length) return;

      const characterId = memberRows[0].character_id;
      const rollResult = performRoll(modifier, dc, isCombat);
      rollResult.skillLabel = skillLabel || 'Check';
      rollResult.rollType = rollType || 'skill';

      const { rows } = await pool.query(
        `INSERT INTO session_messages (session_id, user_id, character_id, msg_type, roll_data)
         VALUES ($1, $2, $3, 'roll', $4) RETURNING *`,
        [sessionId, socket.user.sub, characterId, JSON.stringify(rollResult)]
      );

      const { rows: charRows } = await pool.query(
        'SELECT character_name, image_url, faction FROM spire_characters WHERE id = $1',
        [characterId]
      );

      io.to(`session:${sessionId}`).emit('session:message', {
        ...rows[0],
        character_name: charRows[0]?.character_name,
        image_url: charRows[0]?.image_url,
        faction: charRows[0]?.faction,
      });
    } catch (err) {
      console.error('[Session:roll]', err);
    }
  });

  // ── ATTACK DECLARE ──────────────────────────────────────────────────────────
  socket.on('session:attack-declare', async ({ sessionId, modifier, skillLabel, attackSkill, targetUserId }) => {
    try {
      const { rows: memberRows } = await pool.query(
        'SELECT character_id FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, socket.user.sub]
      );
      if (!memberRows.length) return;

      const { rows: attackerChar } = await pool.query(
        'SELECT character_name, image_url FROM spire_characters WHERE id = $1',
        [memberRows[0].character_id]
      );

      const attackId = `atk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      pendingAttacks.set(attackId, {
        sessionId,
        attackerUserId: socket.user.sub,
        attackerCharacterId: memberRows[0].character_id,
        attackerName: attackerChar[0]?.character_name || 'Unknown',
        attackerImage: attackerChar[0]?.image_url,
        modifier,
        skillLabel,
        attackSkill,
        targetUserId,
      });

      setTimeout(() => pendingAttacks.delete(attackId), 60000);

      io.to(`session:${sessionId}`).emit('session:message', {
        id: `sys-atk-${Date.now()}`,
        msg_type: 'system',
        content: `${attackerChar[0]?.character_name} attacks with ${attackSkill}! Awaiting defense...`,
        created_at: new Date().toISOString(),
      });

      io.to(`session:${sessionId}`).emit('session:defense-prompt', {
        attackId,
        attackerUserId: socket.user.sub,
        attackerName: attackerChar[0]?.character_name || 'Unknown',
        attackerImage: attackerChar[0]?.image_url,
        attackSkill,
        skillLabel,
        targetUserId,
      });
    } catch (err) {
      console.error('[Session:attack-declare]', err);
    }
  });

  // ── DEFENSE CHOOSE ──────────────────────────────────────────────────────────
  socket.on('session:defense-choose', async ({ attackId, defenseType }) => {
    try {
      const pending = pendingAttacks.get(attackId);
      if (!pending) return socket.emit('session:error', { message: 'Attack expired or not found' });
      if (pending.targetUserId !== socket.user.sub) return socket.emit('session:error', { message: 'Not your attack to defend' });

      pendingAttacks.delete(attackId);

      const { sessionId, attackerCharacterId, modifier, skillLabel, attackSkill, targetUserId, attackerUserId } = pending;

      if (attackSkill === 'Slugthrowers' && defenseType === 'Lightsaber Parry') {
        return socket.emit('session:error', { message: 'Slugthrowers cannot be deflected by lightsaber parry' });
      }

      const members = await loadEnrichedMembers(sessionId);
      const targetMember = members.find(m => m.user_id === targetUserId);
      const attackerMember = members.find(m => m.user_id === attackerUserId);
      if (!targetMember) return socket.emit('session:error', { message: 'Target not in session' });

      // Check condition blocks
      const targetConditions = targetMember.conditions || [];
      if (targetConditions.includes('disarmed') && ['Lightsaber Parry', 'Melee Parry'].includes(defenseType)) {
        return socket.emit('session:error', { message: 'Cannot parry while Disarmed' });
      }

      const defense = await computeTargetDefenseDC(targetMember, defenseType, attackSkill);
      if (!defense) return socket.emit('session:error', { message: 'Invalid defense type' });
      if (defense.blocked) return socket.emit('session:error', { message: defense.reason });

      // Apply attacker condition modifiers
      const effectiveModifier = applyAttackerConditions(modifier, attackerMember?.conditions);

      const rollResult = performRoll(effectiveModifier, defense.dc, true);
      rollResult.skillLabel = skillLabel || 'Attack';
      rollResult.rollType = 'attack';

      // Soak
      const targetArmor = targetMember.armor || 'unarmored';
      const isLightsaber = attackSkill === 'Lightsabers';
      const isCrit = rollResult.outcome === 'crit_success';
      let soak = ARMOR_SOAK[targetArmor] || 0;
      if (isCrit || isLightsaber) soak = 0;

      let rawDamage = rollResult.damageTier?.damage ?? 0;
      let finalDamage = 0;
      if (rawDamage > 0) {
        if (rollResult.margin != null && rollResult.margin <= 3) {
          finalDamage = Math.max(0, rawDamage - soak);
        } else {
          finalDamage = Math.max(1, rawDamage - soak);
        }
        if (soak === 0) finalDamage = rawDamage;
      }

      rollResult.targeted = {
        targetUserId,
        targetCharacterName: targetMember.character_name,
        targetImageUrl: targetMember.image_url,
        attackSkill: attackSkill || skillLabel,
        defenseType,
        defenseDC: defense.dc,
        defenseBonus: defense.bonus,
        armor: targetArmor,
        soak,
        rawDamage,
        finalDamage,
        lightsaberBypass: isLightsaber,
        critBypass: isCrit,
      };

      if (effectiveModifier !== modifier) {
        rollResult.attackerConditionPenalty = modifier - effectiveModifier;
      }

      const { rows } = await pool.query(
        `INSERT INTO session_messages (session_id, user_id, character_id, msg_type, roll_data)
         VALUES ($1, $2, $3, 'roll', $4) RETURNING *`,
        [sessionId, attackerCharacterId, attackerCharacterId, JSON.stringify(rollResult)]
      );

      const { rows: charRows } = await pool.query(
        'SELECT character_name, image_url, faction FROM spire_characters WHERE id = $1',
        [attackerCharacterId]
      );

      io.to(`session:${sessionId}`).emit('session:message', {
        ...rows[0],
        character_name: charRows[0]?.character_name,
        image_url: charRows[0]?.image_url,
        faction: charRows[0]?.faction,
      });

      io.to(`session:${sessionId}`).emit('session:defense-resolved', { attackId });

      if (finalDamage > 0 && (rollResult.outcome === 'success' || rollResult.outcome === 'crit_success')) {
        await applyDamage(io, sessionId, targetUserId, finalDamage, members);
      }
    } catch (err) {
      console.error('[Session:defense-choose]', err);
    }
  });

  // ── ADD CONDITION (self or session creator) ──────────────────────────────────
  socket.on('session:add-condition', async ({ sessionId, conditionId, targetUserId }) => {
    try {
      if (!CONDITIONS[conditionId]) return;

      // Determine who to apply to: self or specified target (if creator)
      let applyTo = socket.user.sub;
      if (targetUserId && targetUserId !== socket.user.sub) {
        // Verify caller is session creator
        const { rows: sessRows } = await pool.query(
          'SELECT created_by FROM rolling_sessions WHERE id = $1', [sessionId]
        );
        if (!sessRows.length || sessRows[0].created_by !== socket.user.sub) return;
        applyTo = targetUserId;
      }

      const { rows } = await pool.query(
        'SELECT conditions FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, applyTo]
      );
      if (!rows.length) return;

      let conditions = Array.isArray(rows[0].conditions) ? rows[0].conditions : [];
      if (conditions.includes(conditionId)) return;

      conditions = [...conditions, conditionId];
      await pool.query(
        'UPDATE session_members SET conditions = $1 WHERE session_id = $2 AND user_id = $3',
        [JSON.stringify(conditions), sessionId, applyTo]
      );

      io.to(`session:${sessionId}`).emit('session:conditions-update', {
        targetUserId: applyTo,
        conditions,
      });

      const charName = await getCharName(sessionId, applyTo);
      const label = conditionId.replace(/_/g, ' ');
      io.to(`session:${sessionId}`).emit('session:message', {
        id: `sys-cond-${Date.now()}`,
        msg_type: 'system',
        content: `${charName} is now ${label.charAt(0).toUpperCase() + label.slice(1)}`,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Session:add-condition]', err);
    }
  });

  // ── REMOVE CONDITION (self or session creator) ──────────────────────────────
  socket.on('session:remove-condition', async ({ sessionId, conditionId, targetUserId }) => {
    try {
      let applyTo = socket.user.sub;
      if (targetUserId && targetUserId !== socket.user.sub) {
        const { rows: sessRows } = await pool.query(
          'SELECT created_by FROM rolling_sessions WHERE id = $1', [sessionId]
        );
        if (!sessRows.length || sessRows[0].created_by !== socket.user.sub) return;
        applyTo = targetUserId;
      }

      const { rows } = await pool.query(
        'SELECT conditions FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, applyTo]
      );
      if (!rows.length) return;

      let conditions = Array.isArray(rows[0].conditions) ? rows[0].conditions : [];
      if (!conditions.includes(conditionId)) return;

      conditions = conditions.filter(c => c !== conditionId);
      await pool.query(
        'UPDATE session_members SET conditions = $1 WHERE session_id = $2 AND user_id = $3',
        [JSON.stringify(conditions), sessionId, applyTo]
      );

      io.to(`session:${sessionId}`).emit('session:conditions-update', {
        targetUserId: applyTo,
        conditions,
      });

      const charName = await getCharName(sessionId, applyTo);
      const label = conditionId.replace(/_/g, ' ');
      io.to(`session:${sessionId}`).emit('session:message', {
        id: `sys-cond-${Date.now()}`,
        msg_type: 'system',
        content: `${charName} is no longer ${label.charAt(0).toUpperCase() + label.slice(1)}`,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Session:remove-condition]', err);
    }
  });

  // ── USE ACTION (Force powers) ───────────────────────────────────────────────
  socket.on('session:use-action', async ({ sessionId, actionId, targetUserId, modifier }) => {
    try {
      const { rows: memberRows } = await pool.query(
        'SELECT character_id FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, socket.user.sub]
      );
      if (!memberRows.length) return;

      const charName = await getCharName(sessionId, socket.user.sub);
      const room = `session:${sessionId}`;
      const members = await loadEnrichedMembers(sessionId);

      const sysMsg = (content) => {
        io.to(room).emit('session:message', {
          id: `sys-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          msg_type: 'system',
          content,
          created_at: new Date().toISOString(),
        });
      };

      switch (actionId) {
        case 'combat_enhancement':
          sysMsg(`${charName} uses Combat Enhancement! +2 attack AND defense this round. (1 FP)`);
          break;

        case 'force_speed':
          sysMsg(`${charName} uses Force Speed! Two attacks, close+attack, or disengage+attack. (2 FP)`);
          break;

        case 'force_barrier':
          sysMsg(`${charName} uses Force Barrier! +2 soak this round. (1 FP)`);
          break;

        case 'force_lightning': {
          if (!targetUserId) return socket.emit('session:error', { message: 'Target required' });
          const targetName = await getCharName(sessionId, targetUserId);
          await applyDamage(io, sessionId, targetUserId, 2, members);
          await addConditionToMember(io, sessionId, targetUserId, 'stunned');
          sysMsg(`${charName} hits ${targetName} with Force Lightning for 2 damage! ${targetName} is Stunned! (2 FP)`);
          break;
        }

        case 'force_push': {
          if (!targetUserId) return socket.emit('session:error', { message: 'Target required' });
          const targetMember = members.find(m => m.user_id === targetUserId);
          if (!targetMember) return;
          const targetName = targetMember.character_name || 'Unknown';
          const defense = await computeTargetDefenseDC(targetMember, 'Dodge', null);
          const dc = defense?.dc ?? 12;
          const rollMod = modifier ?? 1;
          const rollResult = performRoll(rollMod, dc, true);

          if (rollResult.outcome === 'success' || rollResult.outcome === 'crit_success') {
            const damage = rollResult.damageTier?.damage ?? 0;
            if (damage > 0) await applyDamage(io, sessionId, targetUserId, damage, members);
            await addConditionToMember(io, sessionId, targetUserId, 'prone');
            sysMsg(`${charName} Force Pushes ${targetName}! [${rollResult.die1}]+[${rollResult.die2}]+${rollMod} = ${rollResult.total} vs DC ${dc} — HIT! ${damage > 0 ? damage + ' damage, ' : ''}${targetName} is Prone! (1 FP)`);
          } else {
            sysMsg(`${charName} attempts Force Push on ${targetName}! [${rollResult.die1}]+[${rollResult.die2}]+${rollMod} = ${rollResult.total} vs DC ${dc} — Missed! (1 FP)`);
          }
          break;
        }

        case 'force_healing': {
          const healKey = `${sessionId}:${socket.user.sub}`;
          const count = healCounts.get(healKey) || 0;
          const dc = 12 + (count * 4);
          const rollMod = modifier ?? 1;
          const rollResult = performRoll(rollMod, dc, false);
          healCounts.set(healKey, count + 1);

          if (rollResult.outcome === 'success' || rollResult.outcome === 'crit_success') {
            const healAmount = Math.max(1, rollResult.margin ?? 1);
            await applyHealing(io, sessionId, socket.user.sub, healAmount, members);
            sysMsg(`${charName} channels Force Healing! [${rollResult.die1}]+[${rollResult.die2}]+${rollMod} = ${rollResult.total} vs DC ${dc} — Heals ${healAmount} HP! (1 FP, next DC: ${dc + 4})`);
          } else {
            sysMsg(`${charName} attempts Force Healing! [${rollResult.die1}]+[${rollResult.die2}]+${rollMod} = ${rollResult.total} vs DC ${dc} — Failed! (1 FP, next DC: ${dc + 4})`);
          }
          break;
        }

        default:
          socket.emit('session:error', { message: 'Unknown action' });
      }
    } catch (err) {
      console.error('[Session:use-action]', err);
    }
  });

  // ── HP UPDATE (manual) ──────────────────────────────────────────────────────
  socket.on('session:update-hp', async ({ sessionId, targetUserId, hpChange }) => {
    try {
      const { rows: check } = await pool.query(
        'SELECT 1 FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, socket.user.sub]
      );
      if (!check.length) return;

      const members = await loadEnrichedMembers(sessionId);
      const target = members.find(m => m.user_id === targetUserId);
      if (!target) return;
      const maxHp = computeMaxHp(target);

      if (hpChange > 0) {
        await applyHealing(io, sessionId, targetUserId, hpChange, members);
      } else if (hpChange < 0) {
        await applyDamage(io, sessionId, targetUserId, Math.abs(hpChange), members);
      }

      const { rows: hpRows } = await pool.query(
        'SELECT current_hp FROM session_members WHERE session_id = $1 AND user_id = $2',
        [sessionId, targetUserId]
      );
      const newHp = hpRows[0]?.current_hp ?? 0;
      const charName = target.character_name || 'Unknown';
      const verb = hpChange > 0 ? 'heals' : 'takes';
      const amount = Math.abs(hpChange);
      const unit = hpChange > 0 ? 'HP' : 'damage';

      io.to(`session:${sessionId}`).emit('session:message', {
        id: `sys-hp-${Date.now()}-${Math.random()}`,
        msg_type: 'system',
        content: `${charName} ${verb} ${amount} ${unit} \u2192 ${newHp}/${maxHp} HP`,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Session:update-hp]', err);
    }
  });

  // ── DISCONNECT ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    for (const sessionId of joinedRooms) {
      socket.to(`session:${sessionId}`).emit('session:user-left', {
        user_id: socket.user.sub,
        username: socket.user.username,
      });
    }
    joinedRooms.clear();
  });
};
