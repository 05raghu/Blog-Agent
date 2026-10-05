import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local',
});

export default {
  schema: './src/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
  verbose: true,
  strict: true,
} satisfies Config;
