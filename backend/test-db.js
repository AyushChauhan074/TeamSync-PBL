const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Ygl6MyWTb1xu@ep-late-voice-aqcz0txu.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkUser() {
  try {
    const res = await pool.query('SELECT * FROM users WHERE roll_number = $1', ['230111585']);
    console.log(`Found ${res.rows.length} users with roll number 230111585.`);
    if (res.rows.length > 0) {
      console.log('User details:', res.rows[0]);
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

checkUser();
