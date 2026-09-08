# MemoryNo — Portable AI Memory SDK

## Ownership & Non-Negotiables (read first)

- This is **not an app**. It is an SDK + MCP server that any agent (Claude Code, Cursor, Codex, any MCP-capable client) can attach to.
- Memory belongs to the user, travels across tools/machines, and is queryable/updatable by any connected agent — including asking the agent to add a skill, store a project fact, or save a credential, in plain conversational language.
- Multi-tenant from day one (`user_id` on every row) even though v1 ships for a single user — this avoids a schema rewrite later.
- The vault (secrets) is architecturally isolated from regular memory: separate table, separate crypto path, never touched by the embedding pipeline, zero-knowledge (the operator/host can never read a stored secret in plaintext).

## Stack

- **Database:** Turso Cloud (libSQL) — cloud-first, so memory is already multi-device from day one.
- **Server:** TypeScript, Node.js.
- **Transport:** MCP server (stdio + remote/URL mode). CLI installer: `npx memoryno init` — detects the calling agent, writes its MCP config, prompts for Turso credentials + embedding API key.
- **Embeddings:** external API (OpenAI or Voyage — pick one, keep the client swappable) for regular memory only. The vault never generates embeddings — it's retrieved by exact `key_name`, not semantic search.

---

## 1. Database Schema (Turso / libSQL)

```sql
-- Core memory node
CREATE TABLE memories (
    hash TEXT PRIMARY KEY,               -- SHA-256(user_id + content + type + created_at)
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('note','skill','preference','env')),
    title TEXT,
    content TEXT NOT NULL,
    embedding F32_BLOB(1536),            -- match the chosen embedding model's dimension
    metadata JSONB DEFAULT '{}',
    recall_count INTEGER DEFAULT 0,
    recall_score REAL DEFAULT 0,         -- time-decayed weight, computed/updated on recall (see §4)
    last_recalled_at INTEGER,
    is_deleted INTEGER DEFAULT 0,        -- soft delete
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_memories_user_type ON memories(user_id, type, is_deleted);
CREATE INDEX idx_memories_embedding ON memories(libsql_vector_idx(embedding));

-- Relationships between memories (NOT a JSON array — see rationale below)
CREATE TABLE memory_links (
    source_hash TEXT NOT NULL REFERENCES memories(hash) ON DELETE CASCADE,
    target_hash TEXT NOT NULL REFERENCES memories(hash) ON DELETE CASCADE,
    relation_type TEXT DEFAULT 'related',  -- 'related' | 'depends_on' | 'supersedes' | 'context_for'
    weight REAL DEFAULT 1.0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (source_hash, target_hash, relation_type)
);
CREATE INDEX idx_links_target ON memory_links(target_hash);

-- Vault: fully separate table, separate trust boundary
CREATE TABLE vault_entries (
    hash TEXT PRIMARY KEY,               -- SHA-256(user_id + key_name + created_at)
    user_id TEXT NOT NULL,
    key_name TEXT NOT NULL,              -- e.g. "key_gemini" — retrieval handle, never the secret
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    salt TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    kdf TEXT DEFAULT 'argon2id',
    created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_vault_user_keyname ON vault_entries(user_id, key_name);

-- Recovery key wrap (one row per user, created on first vault_store)
CREATE TABLE vault_recovery (
    user_id TEXT PRIMARY KEY,
    wrapped_master_key TEXT NOT NULL,    -- AES key wrapped with recovery key instead of passphrase
    recovery_salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
```

**Why not follow the earlier (Gemini) draft on two points:**
- `linked_hashes` as a JSON array inside `memories` doesn't scale — SQLite/libSQL can't index inside a JSON array, so "find everything linked to X" becomes a full table scan once memory grows past a few hundred rows. A real join table (`memory_links`) with an index on `target_hash` keeps that query cheap forever, and lets each link carry a `relation_type`.
- Storing vault ciphertext as a column on `memories` mixes trust boundaries. Keeping `vault_entries` fully separate means read permissions, backup policy, and audit logging can differ for secrets vs. regular notes without touching the memory table at all.

---

## 2. MCP Tools

| Tool | Purpose | Notes |
|---|---|---|
| `store_memory` | Save note/skill/preference/env; builds embedding | type + content + optional title/metadata |
| `recall_memory` | Semantic search + type filter, ranked by `recall_score` | Triggers `reinforce_memory` internally on the returned hits |
| `link_memory` | Create a typed relationship between two hashes | |
| `reinforce_memory` | Bumps `recall_count` / `last_recalled_at` / recomputes `recall_score` | Internal — called automatically on every recall, never needs an explicit user request |
| `vault_store` | Encrypt + store a secret under `key_name` | Requires passphrase; on a user's very first call, also generates and displays the one-time recovery key |
| `vault_retrieve` | Decrypt a secret on demand | Passphrase supplied fresh each call; plaintext exists only in RAM for the duration of the call, never logged, never written to disk |
| `vault_rotate` | Re-encrypt the entire vault under a new passphrase | |

**Conversational examples this must support directly (from the user's own framing):**
- *"خزن في ذاكرتي: أفضل pm2 على الدوكر، المنفذ 3333 مرتبط بـ test.domain.com"* → `store_memory(type: "env", content: "...")`.
- *"خزن هذا المفتاح باسم key_gemini، كلمة السر @12345666"* → `vault_store(key_name: "key_gemini", secret: "...", passphrase: "@12345666")`, returns ciphertext confirmation only, never echoes the secret back in the tool result.

---

## 3. Embedding Pipeline

- Regular memory (`note`/`skill`/`preference`/`env`) → sent to the chosen embedding API (OpenAI or Voyage) at `store_memory` time. Pick one provider, wrap it behind a small interface (`EmbeddingProvider.embed(text): number[]`) so it's swappable later without touching the schema.
- Vault content is **never** sent to the embedding API and never embedded — it's retrieved purely by `key_name` via `vault_retrieve`, not semantic search. This is what keeps the "sovereign memory" claim true: secrets never leave the encryption boundary, even for indexing.

---

## 4. Recall Scoring (time-decayed, not a raw counter)

Computed at query time (or refreshed by a lightweight periodic job — implementer's choice for v1):

```
decay_factor = exp(-λ * days_since_last_recall)
recall_score = recall_count * decay_factor
```

`λ ≈ 0.05` is a reasonable default (roughly a 14-day half-life of relevance). This keeps `recall_memory` ranking from being permanently dominated by old, no-longer-relevant entries just because they were queried a lot once — a memory recalled today should be able to outrank one recalled 50 times a year ago.

---

## 5. Vault Crypto Flow

```
store:
  passphrase → Argon2id(passphrase, salt) → AES-256-GCM key
             → encrypt(secret) → {ciphertext, iv, salt, auth_tag}
             → written to vault_entries — plaintext never touches logs or disk

retrieve:
  passphrase (supplied fresh by the user/agent each call, never cached)
             → re-derive the same AES key via Argon2id + stored salt
             → decrypt in memory → return to caller → zeroed from process memory after use

first vault_store for a user:
  → generate a random 32-byte recovery key
  → wrap a copy of the AES master key with it → store in vault_recovery
  → display the recovery key to the user exactly once (never stored server-side in plaintext,
    never emailed — the user is responsible for saving it, e.g. in a password manager)

vault_rotate:
  → decrypt everything with the old passphrase
  → re-encrypt every vault_entries row under the new passphrase
  → re-wrap vault_recovery under the new passphrase (recovery key itself stays the same)
```

There is no "forgot password" email-reset path — this would break the zero-knowledge property. Losing both the passphrase and the recovery key means the vault is permanently unrecoverable by design.

---

## 6. CLI / Installer

```bash
npx memoryno init
```

Should:
1. Detect the calling environment (Claude Code / Cursor / Codex / generic MCP client) where possible, or ask.
2. Prompt for Turso DB URL + auth token, and the embedding API key.
3. Write the appropriate MCP server config for the detected client so it's immediately visible as a tool to the agent, no manual JSON editing required.
4. Run schema migrations against the Turso DB (create tables from §1 if not present).

---

## 7. Build Order (v1 → hardened)

1. `memories` table + `store_memory` / `recall_memory` (type + tag filtering only, no vector yet) — gets a working memory loop end-to-end fastest.
2. MCP server wiring so Claude Code / Cursor can see and call these tools.
3. Add the embedding pipeline + Turso vector index; upgrade `recall_memory` to semantic search.
4. Vault (`vault_store` / `vault_retrieve` / `vault_rotate` + recovery key flow) — treat as its own hardening pass, not bolted onto step 1.
5. `memory_links` (`link_memory`) + time-decayed `recall_score` — layered on top of a working base, not blocking it.

---

## Definition of Done for v1

- An agent (Claude Code, Cursor, etc.) connected via MCP can: store a note/skill/preference/env memory in plain conversational language, recall it semantically later, link two memories together, and store/retrieve a vault secret by name — all without the user touching a database client or writing SQL themselves.
- No vault plaintext ever appears in a tool result log, a database column, or a file on disk.
- Memory persists in Turso Cloud and is available immediately from a second machine/agent using the same credentials — this is the core promise ("ذاكرة متنقلة") and should be the first thing verified once step 2 is working.
