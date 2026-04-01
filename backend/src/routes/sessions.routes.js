const router      = require('express').Router();
const auth        = require('../middleware/auth');
const rejectGuest = require('../middleware/rejectGuest');
const c           = require('../controllers/sessions.controller');

router.get('/',           auth, rejectGuest, c.listSessions);
router.post('/',          auth, rejectGuest, c.createSession);
router.get('/:id',        auth, rejectGuest, c.getSession);
router.post('/:id/join',  auth, rejectGuest, c.joinSession);
router.post('/:id/leave', auth, rejectGuest, c.leaveSession);
router.delete('/:id',     auth, rejectGuest, c.deleteSession);

module.exports = router;
