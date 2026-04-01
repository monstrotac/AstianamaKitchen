const express  = require('express');
const path     = require('path');
const multer   = require('multer');

const auth         = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const rejectGuest  = require('../middleware/rejectGuest');

const {
  listCharacters, listMyCharacters, listCharactersForUser, getCharacter,
  createCharacter, updateCharacter, uploadImage, setActiveCharacter,
  getCombatAbilities,
  listSkills, upsertSkills, deleteSkill,
  getDescriptions,
  listTrials, createTrial, getTrial, updateTrialStatus, deleteTrial,
  listEntries, addEntry,
  listEvents, createEvent, deleteEvent,
  listStories, getStory, createStory, updateStory, deleteStory, listRecentStories,
  listReports, getReport, createReport, updateReport, deleteReport,
  getActivityFeed,
} = require('../controllers/sanctum.controller');

const router = express.Router();

// ── Multer (image uploads) ────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.charId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Images only'));
  },
});

// ── Characters ────────────────────────────────────────────────────────────────

router.get('/characters',              optionalAuth, listCharacters);
router.get('/characters/mine',         auth,         listMyCharacters);
router.get('/characters/for-user/:userId', auth,    listCharactersForUser);
router.post('/characters',             auth, rejectGuest, createCharacter);
router.get('/characters/:charId',      optionalAuth, getCharacter);
router.patch('/characters/:charId',    auth, rejectGuest, updateCharacter);
router.post('/characters/:charId/image', auth, rejectGuest, upload.single('image'), uploadImage);

// ── Combat Ability Definitions ────────────────────────────────────────────────

router.get('/combat-abilities', getCombatAbilities);

// ── Active character ──────────────────────────────────────────────────────────

router.put('/active-character', auth, rejectGuest, setActiveCharacter);

// ── Skills ────────────────────────────────────────────────────────────────────

router.get('/characters/:charId/skills',                optionalAuth, listSkills);
router.put('/characters/:charId/skills',                auth, rejectGuest, upsertSkills);
router.delete('/characters/:charId/skills/:skillName',  auth, rejectGuest, deleteSkill);

// ── Descriptions ──────────────────────────────────────────────────────────────

router.get('/descriptions', getDescriptions);

// ── Trials ────────────────────────────────────────────────────────────────────

router.get('/trials',       optionalAuth,                           listTrials);
router.post('/trials',      auth, rejectGuest,                      createTrial);
router.get('/trials/:id',   optionalAuth,                           getTrial);
router.patch('/trials/:id',  auth, rejectGuest,                      updateTrialStatus);
router.delete('/trials/:id', auth, rejectGuest,                      deleteTrial);

// ── Trial Entries ──────────────────────────────────────────────────────────────

router.get('/trials/:id/entries',  optionalAuth, listEntries);
router.post('/trials/:id/entries', auth, rejectGuest, addEntry);

// ── Events ────────────────────────────────────────────────────────────────────

router.get('/events',        optionalAuth, listEvents);
router.post('/events',       auth, rejectGuest, createEvent);
router.delete('/events/:id', auth, rejectGuest, deleteEvent);

// ── Activity Feed ─────────────────────────────────────────────────────────

router.get('/feed', optionalAuth, getActivityFeed);

// ── Stories ────────────────────────────────────────────────────────────────

router.get('/stories/recent',                                optionalAuth, listRecentStories);
router.get('/characters/:charId/stories',                    optionalAuth, listStories);
router.get('/characters/:charId/stories/:storyId',           optionalAuth, getStory);
router.post('/characters/:charId/stories',                   auth, rejectGuest, createStory);
router.patch('/characters/:charId/stories/:storyId',         auth, rejectGuest, updateStory);
router.delete('/characters/:charId/stories/:storyId',        auth, rejectGuest, deleteStory);

// ── Reports ────────────────────────────────────────────────────────────────

router.get('/reports',        optionalAuth, listReports);
router.get('/reports/:id',    optionalAuth, getReport);
router.post('/reports',       auth, rejectGuest, createReport);
router.patch('/reports/:id',  auth, rejectGuest, updateReport);
router.delete('/reports/:id', auth, rejectGuest, deleteReport);

module.exports = router;
