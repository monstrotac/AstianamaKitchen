const router      = require('express').Router();
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const c           = require('../controllers/users.controller');

router.get('/',         auth, requireRole('solstice'), c.listUsers);
router.post('/',        auth, requireRole('solstice'), c.createUser);
router.get('/:id',      auth, c.getUser);
router.patch('/:id',    auth, c.updateUser);

router.get('/:id/sheet',   auth, c.getSheet);
router.patch('/:id/sheet', auth, c.updateSheet);

router.get('/:id/skills',   auth, c.getSkills);
router.patch('/:id/skills', auth, c.updateSkills);

module.exports = router;
