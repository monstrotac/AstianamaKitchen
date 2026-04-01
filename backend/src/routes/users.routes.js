const router      = require('express').Router();
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const rejectGuest = require('../middleware/rejectGuest');
const c           = require('../controllers/users.controller');

router.get('/',         auth, requireRole('solstice'), c.listUsers);
router.post('/',        auth, rejectGuest, requireRole('solstice'), c.createUser);
router.get('/:id',      auth, c.getUser);
router.patch('/:id',    auth, rejectGuest, c.updateUser);
router.delete('/:id',  auth, rejectGuest, requireRole('solstice'), c.deleteUser);

router.get('/:id/sheet',   auth, c.getSheet);
router.patch('/:id/sheet', auth, rejectGuest, c.updateSheet);

router.get('/:id/skills',   auth, c.getSkills);
router.patch('/:id/skills', auth, rejectGuest, c.updateSkills);

module.exports = router;
