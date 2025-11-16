const { Pool } = require('pg');
const { requireEnv } = require('../utils/env');

const pool = new Pool({
  user: requireEnv('DB_USER'),
  host: requireEnv('DB_HOST'),
  database: requireEnv('DB_NAME'),
  password: requireEnv('DB_PASS'),
  port: Number(requireEnv('DB_PORT'))
});

pool
  .connect()
  .then(client => {
    console.log('✅ Database connection successful');
    client.release();
  })
  .catch(error => {
    console.error('❌ Database connection error:', error.message);
  });

module.exports = pool;
