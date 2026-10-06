const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

(async () => {
  try {
    // Check sme_profiles table structure
    const smeCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sme_profiles'
      ORDER BY ordinal_position;
    `);
    
    console.log('SME Profiles Table Structure:');
    console.log(smeCheck.rows.slice(0, 3));
    
    // Check if there are any rows
    const smeRows = await pool.query('SELECT COUNT(*) FROM sme_profiles');
    console.log('SME Profiles Row Count:', smeRows.rows[0].count);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
