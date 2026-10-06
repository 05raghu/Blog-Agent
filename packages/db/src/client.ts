// Database client for Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

let db: any = null;
let pool: Pool | null = null;

if (DATABASE_URL) {
  try {
    // Create postgres pool
    pool = new Pool({
      connectionString: DATABASE_URL,
    });

    // Create drizzle instance
    db = drizzle(pool, { schema });
    console.log('[DB] Database client initialized with Supabase');
  } catch (error) {
    console.error('[DB] Failed to initialize database client:', error);
  }
} else {
  console.warn('[DB] DATABASE_URL not set - database operations will fail');
}

export { db };
export type Database = typeof db;
