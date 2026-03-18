require('dotenv').config({ path: require('path').join(__dirname, '..', `.env.${process.env.NODE_ENV || 'development'}`) });

const app     = require('./app');
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
  app.listen(PORT, () => {
    console.log(`[Gardeners API] ${process.env.NODE_ENV} — port ${PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
