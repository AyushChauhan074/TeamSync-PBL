require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function fixAdminPassword() {
  const client = await pool.connect();
  try {
    console.log('🔐 Fixing Admin Password...\n');

    // Hash the correct admin password
    const adminPassword = 'Admin@123';
    const hash = await bcrypt.hash(adminPassword, 12);

    // Update admin user
    const result = await client.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = NOW() 
       WHERE roll_number = 'ADMIN001'
       RETURNING roll_number, name, role`,
      [hash]
    );

    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log(`   Roll Number: ${result.rows[0].roll_number}`);
      console.log(`   Name: ${result.rows[0].name}`);
      console.log(`   Role: ${result.rows[0].role}`);
      console.log(`   Password: Admin@123\n`);
    } else {
      console.log('❌ Admin user not found in database');
      console.log('   Creating admin user...\n');
      
      const insertResult = await client.query(
        `INSERT INTO users (roll_number, name, email, password_hash, role, branch, phone, github_username, bio, skills, interests)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING roll_number, name, role`,
        [
          'ADMIN001',
          'Admin',
          'admin@gehu.ac.in',
          hash,
          'admin',
          'Administration',
          '+91 9876543225',
          'admin',
          'System Administrator for TeamSync PBL Platform',
          ['System Administration', 'Database Management', 'User Management'],
          ['System Management', 'Platform Administration']
        ]
      );
      
      console.log('✅ Admin user created successfully!');
      console.log(`   Roll Number: ${insertResult.rows[0].roll_number}`);
      console.log(`   Name: ${insertResult.rows[0].name}`);
      console.log(`   Role: ${insertResult.rows[0].role}`);
      console.log(`   Password: Admin@123\n`);
    }

    // Also fix faculty password
    const facultyPassword = '234555999';
    const facultyHash = await bcrypt.hash(facultyPassword, 12);
    
    const facultyResult = await client.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = NOW() 
       WHERE roll_number = '234555999'
       RETURNING roll_number, name, role`,
      [facultyHash]
    );

    if (facultyResult.rows.length > 0) {
      console.log('✅ Faculty password updated successfully!');
      console.log(`   Roll Number: ${facultyResult.rows[0].roll_number}`);
      console.log(`   Name: ${facultyResult.rows[0].name}`);
      console.log(`   Password: 234555999 (same as roll number)\n`);
    }

    console.log('🎉 Password fix complete!\n');
    console.log('📝 Login Credentials:');
    console.log('   Admin  → Roll: ADMIN001   | Pass: Admin@123');
    console.log('   Faculty → Roll: 234555999 | Pass: 234555999');
    console.log('   Student → Roll: 230111589 | Pass: 230111589\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminPassword().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
