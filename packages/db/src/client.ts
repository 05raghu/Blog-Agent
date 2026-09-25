// Database client for Drizzle ORM
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

export type Database = typeof db;
