/**
 * Middleware that blocks guest (unapproved) users from performing write operations.
 * Place after auth middleware so req.user is populated.
 */
function rejectGuest(req, res, next) {
  if (req.user && req.user.role === 'guest') {
    return res.status(403).json({ error: 'Your account is pending approval. You cannot perform this action yet.' });
  }
  next();
}

module.exports = rejectGuest;
