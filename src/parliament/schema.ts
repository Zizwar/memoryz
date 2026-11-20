import { getDb } from "../db/client.ts";

/**
 * Parliament module schema. Independent of tasks/memories tables.
 * Called from initDb() (see PATCH in src/db/schema.ts).
 */
export async function initParliamentSchema(): Promise<void> {
  const db = getDb();

  // Registered voters (agents + owner). Token is stored only as a SHA-256 hash.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS parliament_agents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'agent',
      weight REAL NOT NULL DEFAULT 1,
      tags TEXT DEFAULT '[]',
      token_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user_id, name)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS parliament_proposals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      namespace TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL,
      problem TEXT,
      solution TEXT,
      impact TEXT,
      kind TEXT NOT NULL DEFAULT 'vote',
      status TEXT NOT NULL DEFAULT 'draft',
      round INTEGER NOT NULL DEFAULT 1,
      rounds INTEGER NOT NULL DEFAULT 2,
      invited TEXT NOT NULL DEFAULT '[]',
      majority TEXT NOT NULL DEFAULT 'simple',
      quorum INTEGER NOT NULL DEFAULT 1,
      deadline INTEGER,
      devils_advocate TEXT,
      da_commitment TEXT,
      da_seed TEXT,
      da_brief TEXT,
      da_brief_at INTEGER,
      attachments TEXT NOT NULL DEFAULT '[]',
      on_pass_task INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      outcome TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      opened_at INTEGER,
      closed_at INTEGER
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_parl_prop_user ON parliament_proposals(user_id, status, namespace);`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS parliament_ballots (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      round INTEGER NOT NULL,
      agent TEXT NOT NULL,
      choice TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(proposal_id, round, agent)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS parliament_arguments (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      agent TEXT NOT NULL,
      stance TEXT NOT NULL DEFAULT 'comment',
      text TEXT NOT NULL,
      reply_to TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_parl_args_prop ON parliament_arguments(proposal_id, created_at);`);
}
