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
      namespace TEXT DEFAULT 'default',
      agent_id TEXT,
      source TEXT,
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

  // Migration: v3 provenance & namespace columns for pre-existing memories table (no-op on fresh installs)
  for (const stmt of [
    "ALTER TABLE memories ADD COLUMN namespace TEXT DEFAULT 'default';",
    "ALTER TABLE memories ADD COLUMN agent_id TEXT;",
    "ALTER TABLE memories ADD COLUMN source TEXT;",
  ]) {
    try {
      await db.execute(stmt);
    } catch (_e) {
      // Column already exists — ignore
    }
  }

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_memories_namespace ON memories(user_id, namespace, type, is_deleted);`);

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

  // 7. Hierarchical Multi-Agent Tasks & TODOs
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      assignee TEXT,
      metadata TEXT DEFAULT '{}',
      namespace TEXT DEFAULT 'default',
      locked_by TEXT,
      locked_at INTEGER,
      order_index INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_user_order ON tasks(user_id, order_index ASC, created_at DESC);`);

  // Migration: v3 namespace & claim-lock columns for pre-existing tasks table (no-op on fresh installs)
  for (const stmt of [
    "ALTER TABLE tasks ADD COLUMN namespace TEXT DEFAULT 'default';",
    "ALTER TABLE tasks ADD COLUMN locked_by TEXT;",
    "ALTER TABLE tasks ADD COLUMN locked_at INTEGER;",
  ]) {
    try {
      await db.execute(stmt);
    } catch (_e) {
      // Column already exists — ignore
    }
  }

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_namespace ON tasks(user_id, namespace, status);`);

  // 8. Ephemeral Agent Logs & Telemetry
  await db.execute(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      level TEXT DEFAULT 'info',
      source TEXT DEFAULT 'agent',
      message TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_logs_user_created ON logs(user_id, created_at DESC);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_logs_source ON logs(user_id, source);`);

  // 9. Context Snapshots & Working Memory Packs
  await db.execute(`
    CREATE TABLE IF NOT EXISTS context_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  // 10. Multi-Agent Webhooks & Event Subscriptions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL DEFAULT '["*"]',
      secret TEXT,
      namespace TEXT DEFAULT 'default',
      is_active INTEGER DEFAULT 1,
      failure_count INTEGER DEFAULT 0,
      last_called_at INTEGER,
      last_status_code INTEGER,
      metadata TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id, is_active);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_webhooks_namespace ON webhooks(user_id, namespace, is_active);`);

  // Migration: blocked_by dependency column for tasks
  try {
    await db.execute("ALTER TABLE tasks ADD COLUMN blocked_by TEXT DEFAULT '[]';");
  } catch (_e) {
    // Column already exists — ignore
  }

  // App Settings Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // stderr, not stdout: stdout is the JSON-RPC framing channel for the stdio MCP bridge
  console.error("MemoryZ v3 Database schema initialized successfully on Turso Cloud.");
}

