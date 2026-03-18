const router             = require('express').Router();
const auth               = require('../middleware/auth');
const requireRole        = require('../middleware/requireRole');
const requireRoleOneOf   = require('../middleware/requireRoleOneOf');
const c                  = require('../controllers/contracts.controller');

// Feed endpoints must come before /:id
router.get('/feed/active',   auth, c.activeFeed);
router.get('/feed/complete', auth, c.completeFeed);

router.get('/',    auth, c.listContracts);
router.post('/',   auth, requireRoleOneOf(['solstice','patron']), c.createContract);
router.get('/:id', auth, c.getContract);
router.patch('/:id',       auth, c.updateContract);
router.patch('/:id/close', auth, c.closeContract);
router.delete('/:id',      auth, requireRole('solstice'), c.deleteContract);

module.exports = router;
