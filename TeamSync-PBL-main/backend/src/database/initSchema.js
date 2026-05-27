require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initSchema() {
  const client = await pool.connect();
  try {
    console.log('🔧 Initializing database schema...\n');

    // Read schema.sql file
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await client.query(schema);

    console.log('✅ Database schema created successfully!\n');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - teams');
    console.log('   - team_members');
    console.log('   - projects');
    console.log('   - contributions\n');

    console.log('👥 Sample data inserted:');
    console.log('   - 12 Students');
    console.log('   - 3 Faculty members');
    console.log('   - 1 Admin');
    console.log('   - 3 Teams');
    console.log('   - 3 Projects\n');

    console.log('🔐 Default Login Credentials:');
    console.log('   Admin   → Roll: ADMIN001   | Pass: Admin@123');
    console.log('   Faculty → Roll: 234555999  | Pass: 234555999');
    console.log('   Student → Roll: 230111589  | Pass: 230111589\n');

  } catch (error) {
    console.error('❌ Schema initialization failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initSchema().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
