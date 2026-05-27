const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function seed() {
  let client;
  try {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Connecting to Neon database...');
    client = await pool.connect();
    
    console.log('Executing schema.sql...');
    await client.query(sql);
    
    console.log('Database successfully seeded!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

seed();
