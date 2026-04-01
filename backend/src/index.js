require('dotenv').config({ path: require('path').join(__dirname, '..', `.env.${process.env.NODE_ENV || 'development'}`) });

const http    = require('http');
const app     = require('./app');
const { initSocket } = require('./socket');
const migrate = require('./db/migrate');
const seed    = require('./db/seed');
const PORT    = process.env.PORT || 3500;

async function start() {
  await migrate();
  try {
    await seed();
  } catch (err) {
    console.error('[Seed] Failed:', err.message);
    console.error('[Seed] Server starting anyway — check DB connection and constraints');
  }
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`[Gardeners API] ${process.env.NODE_ENV} — port ${PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
