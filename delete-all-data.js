const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'qote_user',
  password: process.env.DB_PASSWORD || 'qote_password',
  database: process.env.DB_DATABASE || 'qote_db',
});

async function deleteAllData() {
  const client = await pool.connect();

  try {
    console.log('Fetching tables...');
    const { rows } = await client.query(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'public'`,
    );

    const excludeTables = new Set(['migrations', 'typeorm_metadata']);
    const tables = rows
      .map((row) => row.tablename)
      .filter((table) => !excludeTables.has(table));

    if (tables.length === 0) {
      console.log('No tables found to truncate.');
      return;
    }

    const quotedTables = tables.map((table) => `"${table.replace(/"/g, '""')}"`).join(', ');
    console.log(`Truncating ${tables.length} tables...`);

    await client.query('BEGIN');
    await client.query(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);
    await client.query('COMMIT');

    console.log('All data deleted successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteAllData();
