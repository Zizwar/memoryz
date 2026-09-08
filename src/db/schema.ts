import { getDb } from "./client.ts";

export async function initDb(): Promise<void> {
  const db = getDb();

  // 1. Users Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      api_key TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);`);

  // 2. Core Memories Table (Multi-tenant with 768-dim Vector)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS memories (
      hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('note', 'skill', 'preference', 'env')),
      title TEXT,
      content TEXT NOT NULL,
      embedding F32_BLOB(768),
      metadata TEXT DEFAULT '{}',
      recall_count INTEGER DEFAULT 0,
      recall_score REAL DEFAULT 0,
      last_recalled_at INTEGER,
      is_deleted INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_memories_user_type ON memories(user_id, type, is_deleted);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_memories_recall ON memories(user_id, recall_score DESC);`);

  // Try creating vector index if supported by backend
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories(libsql_vector_idx(embedding));`);
  } catch (err) {
    console.warn("Notice: Vector index creation warning (fallback will be active):", (err as Error).message);
  }

  // 3. Memory Links (Graph Relationships)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS memory_links (
      source_hash TEXT NOT NULL,
      target_hash TEXT NOT NULL,
      relation_type TEXT DEFAULT 'related' CHECK (relation_type IN ('related', 'depends_on', 'supersedes', 'context_for')),
      weight REAL DEFAULT 1.0,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (source_hash, target_hash, relation_type)
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_target ON memory_links(target_hash);`);

  // 4. Zero-Knowledge Vault Entries (Isolated from Memory Table)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS vault_entries (
      hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key_name TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      salt TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      kdf TEXT DEFAULT 'pbkdf2',
      created_at INTEGER NOT NULL
    );
  `);
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_user_keyname ON vault_entries(user_id, key_name);`);

  // 5. Vault Recovery Wrap
  await db.execute(`
    CREATE TABLE IF NOT EXISTS vault_recovery (
      user_id TEXT PRIMARY KEY,
      wrapped_master_key TEXT NOT NULL,
      recovery_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // 6. Audit Activity Stream
  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at DESC);`);

  console.log("MemoryZ Database schema initialized successfully on Turso Cloud.");
}
