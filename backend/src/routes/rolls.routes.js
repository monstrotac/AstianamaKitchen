const router      = require('express').Router();
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const c           = require('../controllers/rolls.controller');

router.get('/:id/rolls',        auth, c.getRolls);
router.post('/:id/rolls',       auth, c.addRoll);
router.delete('/:id/rolls/:rid',auth, requireRole('solstice'), c.deleteRoll);

module.exports = router;
