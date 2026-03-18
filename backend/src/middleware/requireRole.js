function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(403).json({ error: 'Insufficient clearance' });
    if (req.user.role === 'admin' || req.user.role === role || req.user.faction === role) return next();
    return res.status(403).json({ error: 'Insufficient clearance' });
  };
}

module.exports = requireRole;
