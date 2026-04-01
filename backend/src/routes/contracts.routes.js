const router             = require('express').Router();
const auth               = require('../middleware/auth');
const requireRole        = require('../middleware/requireRole');
const requireRoleOneOf   = require('../middleware/requireRoleOneOf');
const rejectGuest        = require('../middleware/rejectGuest');
const c                  = require('../controllers/contracts.controller');

// Feed endpoints must come before /:id
router.get('/feed/active',   auth, c.activeFeed);
router.get('/feed/complete', auth, c.completeFeed);

router.get('/',    auth, c.listContracts);
router.post('/',   auth, rejectGuest, requireRoleOneOf(['solstice','patron']), c.createContract);
router.get('/:id', auth, c.getContract);
router.patch('/:id',       auth, rejectGuest, c.updateContract);
router.patch('/:id/close', auth, rejectGuest, c.closeContract);
router.delete('/:id',      auth, rejectGuest, requireRole('solstice'), c.deleteContract);

module.exports = router;
