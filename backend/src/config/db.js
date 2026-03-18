const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', `.env.${process.env.NODE_ENV || 'development'}`) });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error', err);
});

module.exports = pool;
