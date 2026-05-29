const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const u = await pool.query("SELECT id, name, role, email, roll_number FROM users WHERE LOWER(email) = LOWER('sushant.chamoli@gehu.ac.in')");
    console.log('User:', u.rows[0]);
    
    // Check teams table
    const t = await pool.query("SELECT id, name, project_name, mentor_id, evaluator_id FROM teams");
    console.log('Teams in DB:', t.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
