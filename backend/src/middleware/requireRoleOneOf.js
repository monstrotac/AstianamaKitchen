function requireRoleOneOf(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(403).json({ error: 'Insufficient clearance' });
    if (req.user.role === 'admin' || roles.includes(req.user.role) || roles.includes(req.user.faction)) return next();
    return res.status(403).json({ error: 'Insufficient clearance' });
  };
}

module.exports = requireRoleOneOf;
