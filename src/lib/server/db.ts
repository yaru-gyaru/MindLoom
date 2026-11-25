import { Pool } from "pg";

const globalForPool = globalThis as typeof globalThis & { mindloomPool?: Pool; mindloomSchema?: Promise<void> };

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  globalForPool.mindloomPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
  return globalForPool.mindloomPool;
}

export async function ensureSchema() {
  globalForPool.mindloomSchema ??= (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY,
        email text NOT NULL UNIQUE,
        display_name text NOT NULL,
        surname text NOT NULL DEFAULT '',
        bio text NOT NULL DEFAULT '',
        city text NOT NULL DEFAULT '',
        website text NOT NULL DEFAULT '',
        birth_date date,
        learning_goals text NOT NULL DEFAULT '',
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assignment_id text NOT NULL,
        answer text NOT NULL DEFAULT '',
        completed_at timestamptz,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, assignment_id)
      );
      CREATE INDEX IF NOT EXISTS user_progress_user_updated_idx ON user_progress(user_id, updated_at DESC);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS surname text NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS website text NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date date;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_goals text NOT NULL DEFAULT '';
    `);
  })().catch((error) => { globalForPool.mindloomSchema = undefined; throw error; });
  return globalForPool.mindloomSchema;
}
