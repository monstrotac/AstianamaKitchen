const router = require('express').Router();
const auth   = require('../middleware/auth');
const { login, me, register } = require('../controllers/auth.controller');

router.post('/login',    login);
router.post('/register', register);
router.get('/me',        auth, me);

module.exports = router;
