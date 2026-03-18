const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes     = require('./routes/auth.routes');
const usersRoutes    = require('./routes/users.routes');
const contractRoutes = require('./routes/contracts.routes');
const rollsRoutes    = require('./routes/rolls.routes');
const codexRoutes    = require('./routes/codex.routes');
const skillsRoutes   = require('./routes/skills.routes');
const sanctumRoutes  = require('./routes/sanctum.routes');

const app  = express();
const PROD = process.env.NODE_ENV === 'production';

// In production the Express server itself serves the built React app,
// so no CORS header is needed (same origin). In dev, allow Vite's port.
if (!PROD) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
}

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/contracts', rollsRoutes);
app.use('/api/codex',     codexRoutes);
app.use('/api/skills',    skillsRoutes);
app.use('/api/sanctum',   sanctumRoutes);

// In production: serve the built frontend and fall through to index.html
if (PROD) {
  const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(distDir));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
