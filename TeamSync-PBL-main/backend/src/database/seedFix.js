require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Default passwords: roll_number for students/faculty, 'Admin@123' for admin
// Users should change on first login
const SALT_ROUNDS = 12;

async function fixPasswords() {
  const client = await pool.connect();
  try {
    console.log('🔐 Fixing fake password hashes...\n');

    const { rows: users } = await client.query(
      "SELECT id, roll_number, role FROM users WHERE password_hash LIKE '%student123hash%' OR password_hash LIKE '%admin@123hash%'"
    );

    if (users.length === 0) {
      console.log('✅ No fake hashes found. All passwords already real.');
      return;
    }

    console.log(`Found ${users.length} users with fake hashes. Fixing...\n`);

    for (const user of users) {
      let plainPassword;
      if (user.role === 'admin') {
        plainPassword = 'Admin@123';
      } else {
        // Default: roll number is the password
        plainPassword = user.roll_number;
      }

      const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hash, user.id]
      );
      console.log(`✅ Fixed: ${user.roll_number} (${user.role})`);
    }

    // Also generate team codes for existing teams that don't have one
    const { rows: teams } = await client.query(
      'SELECT id FROM teams WHERE team_code IS NULL'
    );
    for (const team of teams) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await client.query('UPDATE teams SET team_code = $1 WHERE id = $2', [code, team.id]);
      console.log(`✅ Generated team code for team ${team.id}: ${code}`);
    }

    console.log('\n✅ Seed fix complete.');
    console.log('\n⚠️  DEFAULT PASSWORDS:');
    console.log('   Students/Faculty: their roll number (e.g., 230111589)');
    console.log('   Admin: Admin@123');
    console.log('   → Enforce password change on first login!\n');
  } finally {
    client.release();
    await pool.end();
  }
}

fixPasswords().catch(err => {
  console.error('Seed fix failed:', err);
  process.exit(1);
});
