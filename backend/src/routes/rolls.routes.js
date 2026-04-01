const router      = require('express').Router();
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const rejectGuest = require('../middleware/rejectGuest');
const c           = require('../controllers/rolls.controller');

router.get('/:id/rolls',        auth, c.getRolls);
router.post('/:id/rolls',       auth, rejectGuest, c.addRoll);
router.delete('/:id/rolls/:rid',auth, rejectGuest, requireRole('solstice'), c.deleteRoll);

module.exports = router;
