const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    console.log('Running migration...');
    // Add columns to projects table
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS mentor_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS evaluator_id INTEGER REFERENCES users(id);
    `);
    console.log('Successfully added mentor_id and evaluator_id to projects table.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
