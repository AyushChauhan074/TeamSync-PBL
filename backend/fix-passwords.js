const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixPasswords() {
  const client = await pool.connect();
  try {
    console.log('Fetching users to fix passwords...');
    const result = await client.query('SELECT id, roll_number FROM users');
    
    for (const user of result.rows) {
      // The password is the roll_number
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.roll_number, salt);
      
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hash, user.id]
      );
    }
    console.log(`Successfully fixed passwords for ${result.rows.length} users.`);
  } catch (err) {
    console.error('Error fixing passwords:', err);
  } finally {
    client.release();
    pool.end();
  }
}

fixPasswords();
