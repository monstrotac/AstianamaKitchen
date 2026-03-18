const express  = require('express');
const path     = require('path');
const multer   = require('multer');

const auth         = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const {
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
router.post('/characters',             auth,         createCharacter);
router.get('/characters/:charId',      optionalAuth, getCharacter);
router.patch('/characters/:charId',    auth,         updateCharacter);
router.post('/characters/:charId/image', auth, upload.single('image'), uploadImage);

// ── Active character ──────────────────────────────────────────────────────────

router.put('/active-character', auth, setActiveCharacter);

// ── Skills ────────────────────────────────────────────────────────────────────

router.get('/characters/:charId/skills',                optionalAuth, listSkills);
router.put('/characters/:charId/skills',                auth,         upsertSkills);
router.delete('/characters/:charId/skills/:skillName',  auth,         deleteSkill);

// ── Descriptions ──────────────────────────────────────────────────────────────

router.get('/descriptions', getDescriptions);

// ── Trials ────────────────────────────────────────────────────────────────────

router.get('/trials',       optionalAuth,                           listTrials);
router.post('/trials',      auth,                                   createTrial);
router.get('/trials/:id',   optionalAuth,                           getTrial);
router.patch('/trials/:id',  auth,                                   updateTrialStatus);
router.delete('/trials/:id', auth,                                   deleteTrial);

// ── Trial Entries ──────────────────────────────────────────────────────────────

router.get('/trials/:id/entries',  optionalAuth, listEntries);
router.post('/trials/:id/entries', auth,         addEntry);

// ── Events ────────────────────────────────────────────────────────────────────

router.get('/events',        optionalAuth, listEvents);
router.post('/events',       auth,         createEvent);
router.delete('/events/:id', auth,         deleteEvent);

// ── Activity Feed ─────────────────────────────────────────────────────────

router.get('/feed', optionalAuth, getActivityFeed);

// ── Stories ────────────────────────────────────────────────────────────────

router.get('/stories/recent',                                optionalAuth, listRecentStories);
router.get('/characters/:charId/stories',                    optionalAuth, listStories);
router.get('/characters/:charId/stories/:storyId',           optionalAuth, getStory);
router.post('/characters/:charId/stories',                   auth,         createStory);
router.patch('/characters/:charId/stories/:storyId',         auth,         updateStory);
router.delete('/characters/:charId/stories/:storyId',        auth,         deleteStory);

// ── Reports ────────────────────────────────────────────────────────────────

router.get('/reports',        optionalAuth, listReports);
router.get('/reports/:id',    optionalAuth, getReport);
router.post('/reports',       auth,         createReport);
router.patch('/reports/:id',  auth,         updateReport);
router.delete('/reports/:id', auth,         deleteReport);

module.exports = router;
