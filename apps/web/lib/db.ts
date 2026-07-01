import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/drizzle/schema';

/**
 * Drizzle database client.
 *
 * Uses Supabase connection string via service role key.
 * Service role bypasses RLS entirely — all user scoping
 * is enforced at the application level in API routes.
 *
 * CRITICAL: Every query MUST include a userId filter.
 * Missing a userId filter = data leak vulnerability.
 */

const connectionString = process.env.DATABASE_URL!;

// Singleton connection for serverless environments
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export const db = drizzle(client, { schema });

// Export schema for convenience
export { schema };
