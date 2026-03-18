const bcrypt = require('bcrypt');
const pool   = require('../config/db');

const SOLSTICE_EMAIL    = process.env.SOLSTICE_EMAIL    || 'solstice@order.local';
const SOLSTICE_PASSWORD = process.env.SOLSTICE_PASSWORD || 'ChangeThisPassword123!';
const SOLSTICE_CODENAME = process.env.SOLSTICE_CODENAME || 'The Solstice';

const ARTICLES = [
  { num: 'ARTICLE I',   body: 'The Face and The Gardener are not the same person. They share no name, no shadow, no history. What one does, the other has never touched. This is not a preference. It is the foundation.', sort: 1 },
  { num: 'ARTICLE II',  body: 'The Face does not kill. It observes, advises, moves through rooms without leaving marks. Useful because trusted. That trust is not wasted on the blade\'s work.', sort: 2 },
  { num: 'ARTICLE III', body: 'The Gardener carries no pity into the field. Mercy left in the soil becomes rot. A contract accepted is a contract finished. Nothing about the target changes that.', sort: 3 },
  { num: 'ARTICLE IV',  body: 'When The Gardener draws, it is already over. There is no pause, no reconsideration, no window for the target to speak. The season turned the moment the mark was given.', sort: 4 },
  { num: 'ARTICLE V',   body: 'The Gardener does not serve anyone with coin. Service is earned. Those who simply demand the blade will find it pointed the wrong direction. The Order decides who is worthy of the harvest.', sort: 5 },
  { num: 'ARTICLE VI',  body: 'All contact runs through the Garden Channel. No names. No faces. Voice is distorted on both ends. The language of flowers holds until the harvest is closed and the channel goes dark.', sort: 6 },
  { num: 'ARTICLE VII', body: 'The comm device does not exist in any registry. When contact ends, the orchard closes. No record of it remains. No Gardener was ever there.', sort: 7 },
  { num: 'ARTICLE VIII',body: 'The Gardener does not ask if the target deserves it. That question belongs to the client. Once the mark is given, guilt and innocence both go into the soil the same way. The blade does not sort.', sort: 8 },
  { num: 'ARTICLE IX',  body: 'A witness is not a bystander. Anyone who sees the blade at work is part of the harvest. There is no unfortunate timing, no wrong place. The Gardener does not leave loose roots. The field is finished before the walk out.', sort: 9 },
];

const DESCRIPTIONS = [
  // ── Attributes ──────────────────────────────────────────────────────────────
  { type: 'attribute', key: 'str', label: 'Strength',
    description: 'Raw physical power — how hard you hit, how much you lift, how far you throw. At 1, you are slight and weak, easily overpowered. At 3, you are capable in a fight. At 5, you are physically terrifying: your strikes crack bone, your grip is inescapable, and those who face you in melee understand they are already at a disadvantage.' },
  { type: 'attribute', key: 'dex', label: 'Dexterity',
    description: 'Speed, precision, and predatory grace. At 1, your movements are stiff and telegraphed. At 3, you move with trained efficiency. At 5, you are a shadow — fluid, untraceable, capable of threading a blade between ribs before a target registers motion. Lightsaber forms and ranged precision live here.' },
  { type: 'attribute', key: 'con', label: 'Constitution',
    description: 'Endurance, resilience, and the body\'s capacity to absorb punishment. At 1, you tire quickly and break under pressure. At 3, you can take a hit and keep fighting. At 5, you are nearly impossible to put down — poisons slow you, pain does not stop you, and your body keeps moving long after others would collapse.' },
  { type: 'attribute', key: 'int_score', label: 'Intelligence',
    description: 'Cold reasoning, accumulated knowledge, and the analytical mind of a Sith scholar. At 1, your understanding is surface-level and your plans are blunt. At 3, you are educated and capable of strategic thought. At 5, you are a dangerous intellect — reading rooms, exploiting weaknesses, mastering alchemical arts, and three steps ahead of everyone around you.' },
  { type: 'attribute', key: 'wis', label: 'Wisdom',
    description: 'Perception, instinct, and Force attunement. At 1, you miss the obvious and trust the wrong people. At 3, your senses are reliable and your gut rarely misleads you. At 5, you perceive what others cannot — the subtle shift before violence, the lie beneath calm words, the ripple in the Force that warns before the blade falls.' },
  { type: 'attribute', key: 'cha', label: 'Charisma',
    description: 'Presence, manipulation, and the force of personality. At 1, you are forgettable and easily ignored. At 3, you command attention in a room and your words carry weight. At 5, you are magnetically dangerous — capable of turning enemies into tools, breaking loyalty with a conversation, and projecting the kind of dark authority that makes subordinates obey out of something deeper than fear.' },

  // ── Saving Throws ────────────────────────────────────────────────────────────
  { type: 'save', key: 'fortitude', label: 'Fortitude',
    description: 'Resist poisons, disease, physical trauma, and the body\'s breaking point. Called when something threatens to shut down the body itself — toxins, exhaustion, environmental hazards, or the toll of sustained injury.' },
  { type: 'save', key: 'reflex', label: 'Reflex',
    description: 'Dodge, evade, and react to sudden physical threats. Called when speed and body awareness determine whether you get caught in a blast, a collapsing structure, or a surprise strike.' },
  { type: 'save', key: 'willpower', label: 'Willpower',
    description: 'Resist mental compulsion, Force coercion, fear, and psychological breaking. Called when something attempts to override your mind — Jedi mind tricks, Sith domination, terror effects, or prolonged interrogation.' },

  // ── Skills ───────────────────────────────────────────────────────────────────
  { type: 'skill', key: 'Athletics', label: 'Athletics',
    description: 'Covers running, jumping, climbing, swimming, and feats of raw physical exertion. Used when the body must move through environments or overcome physical obstacles at speed or under duress.' },
  { type: 'skill', key: 'Unarmed Combat', label: 'Unarmed Combat',
    description: 'Hand-to-hand fighting — strikes, grapples, chokes, and close-quarters violence without a weapon. Rank 1–2 is street-level brawling. Rank 3–5 is disciplined martial combat capable of killing efficiently and silently.' },
  { type: 'skill', key: 'Melee', label: 'Melee',
    description: 'Proficiency with physical melee weapons — vibro-blades, batons, knives, and non-lightsaber edged weapons. Covers attack technique, disarms, and weapon handling in close combat.' },
  { type: 'skill', key: 'Acrobatics', label: 'Acrobatics',
    description: 'Flips, vaults, falls, balance, and precision movement through space. Used to navigate difficult terrain, escape grapples, land from heights, or move in ways that defy expectation in combat and infiltration.' },
  { type: 'skill', key: 'Stealth', label: 'Stealth',
    description: 'Moving unseen and unheard. Covers shadow movement, suppressing tells, blending into environments, and avoiding detection during surveillance and assassination approaches.' },
  { type: 'skill', key: 'Ranged Weapons', label: 'Ranged Weapons',
    description: 'Proficiency with blasters, slugthrowers, and other ranged weapons. Covers accuracy, quick-draw, suppressive fire, and precision shooting at range under pressure.' },
  { type: 'skill', key: 'Lightsabers', label: 'Lightsabers',
    description: 'The blade forms of the Sith — from Juyo\'s ferocity to Makashi\'s precision. Covers all lightsaber combat stances, dueling, and the specific demands of controlling a weapon that cuts through nearly anything.' },
  { type: 'skill', key: 'Piloting', label: 'Piloting',
    description: 'Operating spacecraft, starfighters, and atmospheric craft. Covers evasive maneuvers, navigation under fire, docking, and the instinctive feel for how a ship responds.' },
  { type: 'skill', key: 'Ground Vehicles', label: 'Ground Vehicles',
    description: 'Operating speeder bikes, speeders, walkers, and other ground vehicles. Covers high-speed pursuit, evasion, terrain navigation, and vehicle combat.' },
  { type: 'skill', key: 'Resilience', label: 'Resilience',
    description: 'The body\'s trained capacity to absorb damage and keep fighting. Directly increases your hit pool. A Sith who invests here is difficult to put down — built to outlast opponents through sheer physical fortitude.' },
  { type: 'skill', key: 'Academics', label: 'Academics',
    description: 'Broad scholarly knowledge — history, galactic geography, cultures, ancient civilizations, and general learned expertise. Used when understanding context, identifying artifacts, or recalling relevant historical facts.' },
  { type: 'skill', key: 'Computing', label: 'Computing',
    description: 'Operating, programming, and slicing computer systems. Covers data extraction, bypassing security protocols, hacking networks, and understanding system architecture from terminals to ship computers.' },
  { type: 'skill', key: 'Demolitions', label: 'Demolitions',
    description: 'Setting, identifying, and disarming explosive devices. Covers shaped charges, timed detonations, structural analysis for maximum effect, and the delicate work of defusing what someone else planted.' },
  { type: 'skill', key: 'Technology', label: 'Technology',
    description: 'Understanding, repairing, and modifying mechanical and electronic systems. Covers field repairs, improvised construction, identifying tech, and working with equipment outside its intended parameters.' },
  { type: 'skill', key: 'Force Alchemy', label: 'Force Alchemy',
    description: 'The Sith art of reshaping matter and life through the dark side. Used for crafting alchemical weapons, enhancing objects with Force properties, and the more dangerous applications of biological modification. Rare and dangerous even among Sith.' },
  { type: 'skill', key: 'Force Knowledge', label: 'Force Knowledge',
    description: 'Theoretical and historical understanding of the Force — its traditions, philosophies, lore, and known applications across both Sith and Jedi lineages. Knowing what something is, where it comes from, and what it is capable of.' },
  { type: 'skill', key: 'Investigation', label: 'Investigation',
    description: 'Active searching, evidence analysis, and piecing together what happened from fragments. Used to find hidden objects, reconstruct events, identify patterns in information, and pursue leads through methodical examination.' },
  { type: 'skill', key: 'Law', label: 'Law',
    description: 'Knowledge of Imperial codes, Sith Order protocols, criminal statutes, and the legal frameworks that govern the galaxy. Useful for identifying leverage, navigating bureaucratic systems, and understanding what others can and cannot do officially.' },
  { type: 'skill', key: 'Medicine', label: 'Medicine',
    description: 'Medical knowledge from field triage to surgical intervention. Rank 1–2 stabilizes wounds and stops bleeding. Rank 3–5 covers complex treatment, poison identification, and the anatomical knowledge that serves equally well in healing and harm.' },
  { type: 'skill', key: 'Military', label: 'Military',
    description: 'Tactical and strategic knowledge of warfare — unit tactics, command structures, battlefield assessment, siege theory, and the doctrines that govern how organized forces fight. Used when planning operations or reading a military situation.' },
  { type: 'skill', key: 'Pharmacopoeia/Poisons', label: 'Pharmacopoeia/Poisons',
    description: 'Knowledge of substances — drugs, sedatives, toxins, and poisons. Covers identification, synthesis, delivery methods, dosing, and antidotes. An essential skill for those who prefer the work done before anyone draws a weapon.' },
  { type: 'skill', key: 'Torture', label: 'Torture',
    description: 'The applied science of extracting information, breaking resistance, and demonstrating consequences. Covers technique, psychological pressure, knowing the line between useful and fatal, and the patience the work requires.' },
  { type: 'skill', key: 'Awareness', label: 'Awareness',
    description: 'Noticing what others miss — details, tells, ambient threats, and the subtle wrongness that precedes danger. Both passive (do you notice?) and active (what do you find when you look?). The difference between walking into an ambush and seeing it coming.' },
  { type: 'skill', key: 'Empathy', label: 'Empathy',
    description: 'Reading people — their emotional state, motivations, deceptions, and the gap between what they say and what they mean. Not sympathy. A predator\'s tool for understanding prey.' },
  { type: 'skill', key: 'Force Intuition', label: 'Force Intuition',
    description: 'The raw, instinctive connection to the Force — feeling presences, sensing danger before it arrives, and the wordless knowing that something is wrong or right. Less studied than Force Knowledge, more felt than understood.' },
  { type: 'skill', key: 'Meditation', label: 'Meditation',
    description: 'Focused mental discipline — controlling the mind under pressure, processing trauma, deepening Force connection through stillness, and the practice of achieving clarity in chaos. Used for recovery, focus, and some Force applications that require calm.' },
  { type: 'skill', key: 'Politics', label: 'Politics',
    description: 'Reading power structures, navigating factional dynamics, understanding what people want and who holds leverage over whom. Used in courts, councils, and any situation where the real weapon is information and positioning.' },
  { type: 'skill', key: 'Survival', label: 'Survival',
    description: 'Staying alive in hostile environments — navigation, finding food and water, building shelter, identifying natural hazards, and the situational reading that keeps you functional when civilization is not an option.' },
  { type: 'skill', key: 'Acting', label: 'Acting',
    description: 'Inhabiting a role convincingly — controlling body language, voice, mannerism, and emotional display to pass as someone else or project a chosen persona. The foundation of long-term infiltration and identity work.' },
  { type: 'skill', key: 'Crafts', label: 'Crafts',
    description: 'Creating things with skill and intention — artisanship, forgery, disguise construction, and the making of objects that require more than technical knowledge. When the work must look right as well as function.' },
  { type: 'skill', key: 'Etiquette', label: 'Etiquette',
    description: 'Navigating formal social environments — court protocols, Imperial ceremony, high-society behavior, and the unspoken rules that govern who belongs in a room. Failure here is visible. Success is invisible.' },
  { type: 'skill', key: 'Expression', label: 'Expression',
    description: 'Communicating through performance, art, or rhetoric — persuasion through narrative, moving an audience, and the use of creative output as a tool of influence. Broader than Acting; covers genuine emotional resonance.' },
  { type: 'skill', key: 'Intimidation', label: 'Intimidation',
    description: 'Making others afraid. Covers direct physical menace, implied threat, psychological pressure, and the kind of presence that makes people reconsider their choices before they make them.' },
  { type: 'skill', key: 'Leadership', label: 'Leadership',
    description: 'Commanding others — through authority, example, fear, or inspiration. Used when directing people in crisis, building loyalty, and ensuring those below you do what you need them to do.' },
  { type: 'skill', key: 'Seduction', label: 'Seduction',
    description: 'Creating desire, attachment, and dependency. Covers romantic manipulation, cultivating obsession, and leveraging intimacy as an intelligence and control tool. Not limited to the physical.' },
  { type: 'skill', key: 'Streetwise', label: 'Streetwise',
    description: 'Navigating the underworld — criminal contacts, black markets, reading neighborhoods, speaking the right language to the right people, and knowing where to find what legitimate channels cannot provide.' },
  { type: 'skill', key: 'Subterfuge', label: 'Subterfuge',
    description: 'Concealment of intent, misdirection, and active deception in social interaction. Where Acting is performing a role, Subterfuge is hiding your real one — lying under scrutiny, deflecting suspicion, and keeping secrets under pressure.' },

  // ── New skills ───────────────────────────────────────────────────────────────
  { type: 'skill', key: 'Jetpack', label: 'Jetpack',
    description: 'Operating and maneuvering with jetpacks and rocket packs. Covers controlled flight, aerial combat positioning, emergency use, and the specific demands of a propulsion system strapped to your back in a firefight.' },
  { type: 'skill', key: 'Riding', label: 'Riding',
    description: 'Controlling mounted animals and creatures — approach, handling, combat from the saddle, and the dominance relationship required to direct a living mount under duress. Some beasts respond to fear. Some require something else.' },
  { type: 'skill', key: 'Slugthrowers', label: 'Slugthrowers',
    description: 'Proficiency with projectile weapons firing physical rounds — ballistic pistols, rifles, and chemically-propelled firearms. Often overlooked. Equally lethal. Harder to deflect than a blaster bolt, and entirely silent with the right suppressor.' },
  { type: 'skill', key: 'Swoop Bikes', label: 'Swoop Bikes',
    description: 'Operating swoop bikes and high-performance repulsorlift racing craft. Covers extreme-speed navigation, pursuit, evasion, and the precise throttle control that keeps you alive at full burn through terrain that would kill anyone slower.' },
  { type: 'skill', key: 'Ancient Technology', label: 'Ancient Technology',
    description: 'Identifying, operating, and salvaging technology from prior eras — pre-Empire hardware, Old Republic systems, Sith relics, and devices whose documentation no longer exists. What most cannot read, you can operate.' },
  { type: 'skill', key: 'Astrography', label: 'Astrography',
    description: 'Knowledge of star systems, hyperspace routes, galactic geography, and navigation. Used to plan travel, identify unknown regions, and understand the spatial relationships that define strategy at scale. You know where things are, and where to disappear.' },
  { type: 'skill', key: 'Biology', label: 'Biology',
    description: 'The scientific study of living organisms — anatomy, ecology, xenobiology, and the physical workings of life across species. Informs medicine, poisons, and the precise understanding of what a body can and cannot be made to endure.' },
  { type: 'skill', key: 'Biotech', label: 'Biotech',
    description: 'The application of biological knowledge to engineering — cybernetics, genetic modification, alchemical tissue work, and the interface between living systems and constructed ones. Where biology ends and machine begins is a question this skill renders irrelevant.' },
  { type: 'skill', key: 'Droids', label: 'Droids',
    description: 'Programming, repairing, modifying, and commanding droid units. Covers everything from restraining bolts to slicing behavioral matrices to building purpose-specific units from salvaged components. A well-modified droid asks no questions.' },
  { type: 'skill', key: 'Engineering', label: 'Engineering',
    description: 'Structural and mechanical design — ships, facilities, weapons systems, and large-scale construction. Used to assess structural weaknesses, design effective systems, and understand how built things work and, more usefully, how they fail.' },
  { type: 'skill', key: 'Enigmas', label: 'Enigmas',
    description: 'Solving puzzles, ciphers, logic traps, and problems designed to exclude most minds. Used for decryption without a computer, Sith riddles, and any situation where the obstacle is a constructed mental challenge with a correct answer buried inside it.' },
  { type: 'skill', key: 'Esoterica', label: 'Esoterica',
    description: 'Knowledge of occult traditions, forbidden lore, mystical symbolism, and the fringe teachings that fall outside recognized Force doctrine. What scholars dismiss, this skill remembers. Some of it should have stayed forgotten.' },
  { type: 'skill', key: 'Finance', label: 'Finance',
    description: 'Understanding and manipulating money — markets, investments, black-market valuations, and the economic systems that fund power. Useful for following credits, hiding them, and knowing exactly what leverage costs before you pay for it.' },
  { type: 'skill', key: 'Force Traditions', label: 'Force Traditions',
    description: 'Scholarly knowledge of Force-using traditions beyond Sith and Jedi — Nightsisters, Baran Do, Dathomiri witches, and the scattered orders that developed their own relationship with the Force. Knowing who they are, what they can do, and what they want.' },
  { type: 'skill', key: 'Repair', label: 'Repair',
    description: 'Hands-on maintenance and restoration of equipment, vehicles, and weapons. Where Technology covers understanding, Repair covers fixing — getting the thing operational again under field conditions with whatever is available.' },
  { type: 'skill', key: 'Research', label: 'Research',
    description: 'Systematic gathering, evaluation, and synthesis of information. Covers archival work, source verification, and the disciplined process of constructing knowledge from fragments across multiple sources. Patience as a weapon.' },
  { type: 'skill', key: 'Science', label: 'Science',
    description: 'Broad applied scientific knowledge — physics, chemistry, astronomy, and the physical laws governing the galaxy. Used when the answer requires understanding how things actually work at a fundamental level rather than how they appear to work.' },
  { type: 'skill', key: 'Animal Ken', label: 'Animal Ken',
    description: 'Understanding and communicating with animals — reading their behavior, earning their trust or compliance, and the patient attunement required to direct a creature that does not share your language. Some animals sense darkness. This skill decides what they do with that.' },
  { type: 'skill', key: 'High Ritual', label: 'High Ritual',
    description: 'Knowledge and performance of formal Force ceremonies, Sith rites, and the structured invocations that certain traditions use to channel the Force through deliberate process rather than instinct. Rare. Methodical. The kind of power that requires preparation, not reaction.' },
  { type: 'skill', key: 'Lucid Dreaming', label: 'Lucid Dreaming',
    description: 'Entering and navigating dream states with intent — Force-touched visions, prophetic fragments, and the mind\'s capacity to receive and interpret what waking senses cannot. Some things are only accessible here. Some things encountered here do not stay there.' },
  { type: 'skill', key: 'Search', label: 'Search',
    description: 'Methodical physical searching — locations, rooms, persons, and terrain. Where Awareness covers passive noticing, Search covers the deliberate, systematic sweep that finds what someone hid carefully and believed was safe.' },
  { type: 'skill', key: 'Artistic Expression', label: 'Artistic Expression',
    description: 'Using creative output as a vehicle for influence — art, music, writing, and performance that moves audiences emotionally and shapes how they see the world. Not the performance of a role, but genuine creative force. People remember what moves them. That memory is useful.' },
  { type: 'skill', key: 'Carousing', label: 'Carousing',
    description: 'Operating effectively in social environments built around pleasure — taverns, gatherings, underworld venues, and the informal settings where guards come down and information flows. Making people comfortable enough to talk. They always do.' },
  { type: 'skill', key: 'Media', label: 'Media',
    description: 'Understanding and operating through information channels — propaganda, broadcast manipulation, shaping public narrative, and the techniques of controlling what people believe by controlling what they hear. The most patient form of violence.' },
];

async function seed() {
  // Nine Articles
  for (const a of ARTICLES) {
    await pool.query(
      `INSERT INTO codex_articles (article_num, body, category, sort_order)
       VALUES ($1, $2, 'standing_articles', $3)
       ON CONFLICT (article_num, category) DO NOTHING`,
      [a.num, a.body, a.sort]
    );
  }
  console.log('Codex articles seeded.');

  // Descriptions (attributes, saves, skills)
  for (const d of DESCRIPTIONS) {
    await pool.query(
      `INSERT INTO spire_descriptions (type, key, label, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (type, key) DO UPDATE SET label=EXCLUDED.label, description=EXCLUDED.description`,
      [d.type, d.key, d.label, d.description]
    );
  }
  console.log('Descriptions seeded.');

  // Solstice account
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email=$1', [SOLSTICE_EMAIL]);
  if (existing.length) {
    console.log('Solstice account already exists, skipping.');
  } else {
    const hash = await bcrypt.hash(SOLSTICE_PASSWORD, 12);
    const { rows: [user] } = await pool.query(
      `INSERT INTO users (email, password_hash, code_name, role)
       VALUES ($1, $2, $3, 'admin') RETURNING id`,
      [SOLSTICE_EMAIL, hash, SOLSTICE_CODENAME]
    );
    console.log(`Solstice account created: ${SOLSTICE_EMAIL}`);
    console.log(`Password: ${SOLSTICE_PASSWORD}  ← change this immediately`);
  }

}

module.exports = seed;

// Allow running directly: node src/db/seed.js
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '..', `.env.${process.env.NODE_ENV || 'development'}`) });
  seed().then(() => pool.end()).catch(err => { console.error(err); process.exit(1); });
}
