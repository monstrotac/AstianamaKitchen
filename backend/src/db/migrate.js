const fs   = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [file]);
    if (rows.length) {
      console.log(`  skip  ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`  apply ${file}`);
  }

  console.log('Migrations complete.');
}

module.exports = migrate;

// Allow running directly: node src/db/migrate.js
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '..', `.env.${process.env.NODE_ENV || 'development'}`) });
  migrate().then(() => pool.end()).catch(err => { console.error(err); process.exit(1); });
}
