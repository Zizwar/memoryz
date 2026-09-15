# MemoryZ v2

Sovereign Persistent Agentic Memory & Hierarchical Multi-Agent Task Substrate for AI coding assistants, autonomous agents, and developer terminal workflows.

MemoryZ acts as a shared, living cognitive substrate across **Cursor**, **Claude Code**, **Windsurf**, **ChatGPT**, and autonomous agent pipelines. It combines vector-based semantic retrieval with time-decay scoring, an isolated Zero-Knowledge vault for sensitive credentials, hierarchical task management, ephemeral scratchpad logs, and token-optimized context packing.

---

## What's New in MemoryZ v2

### 1. Token Economy & Progressive Retrieval
- **Ultra-Compact Recall:** Returns minimalist one-liners (`--compact`) or summary bullet points (`--summary`), consuming ~15-25 tokens per item instead of 200+ tokens of bloated JSON.
- **Token-Budgeted Context Packs (`context_pack` / `memoryz context`):** Merges relevant memory atoms, active task trees, and environment rules into a single high-density prompt block with hard token budgeting (e.g. 1200 tokens).

### 2. Hierarchical Multi-Agent Tasks & TODOs
- **Parent-Child Subtask Nesting:** Create epics, tasks, and nested subtasks at any depth.
- **Open Flexible Statuses:** Works with standard states (`todo`, `in_progress`, `done`, `blocked`) or custom agent states without rigid lock-in.
- **Multi-Agent Handoff:** One agent (e.g. Architect) drafts the task tree; another agent (e.g. Coder) claims a task (`in_progress`), marks it completed (`done`), and updates status for downstream verification.
- **ASCII Tree Representation:** Displays tasks as an ultra-compact visual hierarchy (`[✓] Task`, `[⏳] Subtask`) that AI models understand with minimal token overhead.

### 3. Ephemeral Logs & Scratchpads
- **Zero-Embedding Overhead:** High-speed appending of temporary logs, run traces, build outputs, and debugging scratchpads without consuming Gemini vector quota or cluttering long-term memory.

### 4. Context Snapshots & Working State Checkpoints
- **Save and Restore Context:** Agents can snapshot their active working memory or task progress before ending a turn and restore it later across conversations.

---

## Key Architecture

### 1. Categorized Memory Atoms
- `env`: Ports, infrastructure flags, local domains, process managers.
- `preference`: Developer coding styles, conventions, architectural patterns.
- `skill`: Multi-step agent workflows, procedures, and prompt directives.
- `note`: Reference snippets, architectural notes, and documentation pointers.

### 2. Hierarchical Tasks Table
- Supports `parent_id` recursive nesting, `status`, `priority`, `assignee`, and auto-timestamps (`completed_at`).

### 3. Zero-Knowledge Secret Vault
- Isolated `vault_entries` storage.
- Never indexed by vector embeddings.
- Client-side **AES-256-GCM** encryption with **PBKDF2** key derivation (100,000 rounds).
- Secrets decrypted strictly in process memory.

### 4. Knowledge Graph Relations
- `memory_links` table supports typed semantic graphs: `depends_on`, `context_for`, `related`, and `supersedes`.

---

## Quickstart

### Editor & Agent Setup (One-Line Configurator)

```bash
npx memoryz init --token=<YOUR_API_KEY>
```

This command:
1. Validates connection to the MemoryZ Substrate.
2. Auto-registers the MCP server in `~/.cursor/mcp.json`, Claude Desktop, Claude Code (`~/.claude/mcp.json`), and Windsurf (`~/.codeium/windsurf/mcp_config.json`).
3. Saves credentials locally in `~/.memoryz/config.json`.
4. Generates `.agents/skills/memoryz/SKILL.md`, `CLAUDE.md`, and `AGENTS.md`.

---

## CLI Reference

### Hierarchical Tasks & Multi-Agent TODOs
```bash
# View task tree (token-efficient ASCII hierarchy)
memoryz task list --tree

# Filter active or pending tasks
memoryz task list --status=active

# Create a root task
memoryz task add "Refactor Authentication Module" --priority=high --assignee=architect

# Create a nested subtask under a parent task
memoryz task add "Implement JWT verification" --parent=task_xxx --assignee=coder

# Mark a task done
memoryz task done task_xxx

# Update task status or details
memoryz task update task_xxx --status=in_progress --assignee=claude

# Delete a task and its descendants
memoryz task rm task_xxx
```

### Living Memory & Vector Recall
```bash
# Token-efficient compact recall (saves tokens)
memoryz recall "database ports" --compact

# Standard semantic vector recall
memoryz recall "database ports" --limit=3

# Store new memory atom (with automatic 768-dim Gemini embedding)
memoryz store --type=preference --content="Always use TypeScript strict mode"

# Store via pipe
echo "Staging runs on port 4000" | memoryz store --type=env --title="staging_port"
```

### Ephemeral Logs & Scratchpads
```bash
# Log a quick trace or status
memoryz log "Database migration completed in 42ms" --level=info --source=deploy

# View recent ephemeral logs
memoryz logs --limit=20
```

### Context Packs & Snapshots
```bash
# Generate dense, token-budgeted prompt context block (active tasks + memories)
memoryz context "Authentication" --tokens=1200 --compact

# Save a working memory snapshot
memoryz snapshot save "auth-refactor-session" "Working on JWT routes. Next: unit tests."

# Restore context snapshot
memoryz snapshot get "auth-refactor-session"
```

### Zero-Knowledge Secret Vault
```bash
# Encrypt secret in vault
memoryz vault store --key="stripe_key" --secret="sk_live_..." --pass="passphrase"

# Decrypt secret
memoryz vault get --key="stripe_key" --pass="passphrase"

# List vault handles
memoryz vault list
```

### Stdio MCP Bridge
```bash
# Run standard MCP JSON-RPC protocol over stdio
memoryz mcp
```

---

## MCP Server Specification

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `task_create` | `title`, `parent_id`, `status`, `priority`, `assignee`, `description` | Create hierarchical task or child subtask |
| `task_list` | `status`, `parent_id`, `format` (`tree`, `compact`, `json`) | List tasks in token-saving ASCII tree or list |
| `task_update` | `id`, `status`, `title`, `priority`, `assignee`, `parent_id` | Update task status (e.g. `done`), details, or assignment |
| `task_delete` | `id`, `cascade` | Delete task and optionally its descendants |
| `recall_memory` | `query`, `type`, `limit`, `format` (`compact`, `summary`, `full`) | Semantic vector search with token-saving formats |
| `store_memory` | `type`, `content`, `title`, `metadata` | Persist memory atom with Gemini embedding |
| `link_memory` | `source_hash`, `target_hash`, `relation_type` | Connect memories in the knowledge graph |
| `log_store` | `message`, `level`, `source`, `metadata` | Append ephemeral log without embedding overhead |
| `log_list` | `limit`, `level`, `source`, `format` | Retrieve recent ephemeral logs |
| `context_pack` | `query`, `token_budget`, `include_tasks`, `include_logs`, `format` | Pack token-budgeted prompt context (tasks + memories) |
| `context_snapshot_save` | `name`, `content`, `description` | Save full context checkpoint |
| `context_snapshot_load` | `name` | Restore context checkpoint |
| `vault_store` | `key_name`, `secret_value`, `passphrase` | Encrypt and store secret in Zero-Knowledge vault |
| `vault_retrieve` | `key_name`, `passphrase` | Decrypt secret in transient RAM |
| `vault_list` | *(none)* | List stored vault key metadata |

---

## Programmatic SDKs

### Node.js / TypeScript (npm: `memoryz`)
```javascript
import { 
  recall, 
  store, 
  taskCreate, 
  taskList, 
  taskDone, 
  logStore, 
  getContextPack 
} from "memoryz";

// 1. Hierarchical tasks
const parent = await taskCreate({ title: "Build Auth Module", priority: "high" });
const subtask = await taskCreate({ title: "Add JWT middleware", parentId: parent.id, assignee: "agent_1" });
await taskDone(subtask.id);

// 2. Token-budgeted context pack
const promptContext = await getContextPack("auth module", { tokens: 1000 });

// 3. Ephemeral logs
await logStore({ message: "Auth test passed", level: "info" });
```

---

## Self-Hosting

### Requirements
- **Deno** 2.0+
- **Turso Cloud** database (`libSQL`)
- **Gemini API** key

```bash
git clone https://github.com/Zizwar/memoryz.git
cd memoryz
cp .env.example .env
deno task dev
```

---

## License

MIT
