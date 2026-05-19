import { neon } from '@neondatabase/serverless'

function sql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return neon(url)
}

export async function ensureSchema() {
  const db = sql()
  await db`
    CREATE TABLE IF NOT EXISTS progress (
      user_id  TEXT PRIMARY KEY,
      data     JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function loadProgress(userId: string): Promise<Record<string, unknown>> {
  const db = sql()
  const rows = await db`SELECT data FROM progress WHERE user_id = ${userId}`
  return (rows[0]?.data as Record<string, unknown>) ?? {}
}

export async function saveProgress(userId: string, data: unknown) {
  const db = sql()
  await db`
    INSERT INTO progress (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(data)}, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW()
  `
}
