# MemoryZ

Persistent agentic memory substrate and Model Context Protocol (MCP) server for AI coding assistants, autonomous agents, and developer terminal workflows.

MemoryZ acts as a persistent memory layer across tools such as **Cursor**, **Claude Code**, **Windsurf**, and custom LLM agents. It combines vector-based semantic retrieval with time-decay scoring, an isolated Zero-Knowledge vault for sensitive credentials, and automated configuration for agent environments.

---

## Key Architecture

### 1. Categorized Memory Atoms
- `env`: Ports, infrastructure flags, local domains, process managers.
- `preference`: Developer coding styles, conventions, architectural patterns.
- `skill`: Multi-step agent workflows, procedures, and prompt directives.
- `note`: Reference snippets, architectural notes, and documentation pointers.

### 2. Semantic Vector Recall & Time-Decayed Scoring
- **768-dimensional embeddings** via Google Gemini (`gemini-embedding-001`).
- **Cosine vector indexing** on Turso Cloud (`libSQL`).
- **Recency-weighted decay:**
  $$\text{decay} = e^{-\lambda \times \Delta t}$$
  $$\text{score} = \text{recall\_count} \times \text{decay}$$

### 3. Zero-Knowledge Secret Vault
- Isolated `vault_entries` storage.
- Never indexed by vector embeddings.
- Client-side **AES-256-GCM** encryption with **PBKDF2** key derivation (100,000 rounds).
- Secrets decrypted strictly in process memory.

### 4. Knowledge Graph Relations
- `memory_links` table supports semantic graphs: `depends_on`, `context_for`, `related`, and `supersedes`.

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
4. Writes `.agents/skills/memoryz/SKILL.md`, `CLAUDE.md`, and `AGENTS.md`.

---

## CLI Reference

```bash
# Semantic vector recall
memoryz recall "database ports" --limit=3

# Output XML context block for LLM prompts
memoryz context "developer preferences"

# Store new memory atom
memoryz store --type=preference --content="Always use TypeScript strict mode"

# Store via pipe
echo "Staging runs on port 4000" | memoryz store --type=env --title="staging_port"

# Encrypt secret in vault
memoryz vault store --key="stripe_key" --secret="sk_live_..." --pass="passphrase"

# Decrypt secret
memoryz vault get --key="stripe_key" --pass="passphrase"

# Stdio MCP Bridge
memoryz mcp
```

---

## Programmatic SDKs

### Node.js / TypeScript
```javascript
import { recall, store, getContext } from "memoryz";

const context = await getContext("auth module");
await store({ type: "preference", content: "Prefer immutable data structures" });
```

### Python
```python
import memoryz

memories = memoryz.recall("production guidelines")
xml_context = memoryz.get_context("task description")
memoryz.store("Use port 3333 for staging", memory_type="env")
```

### Shell / Bash
```bash
source <(curl -s https://memoryz.wino.deno.net/client.sh)

memoryz_recall "port"
memoryz_store "preference" "Use pnpm over npm"
```

---

## MCP Server Specification

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `recall_memory` | `query`, `type`, `limit` | Semantic vector search across memory atoms |
| `store_memory` | `type`, `content`, `title` | Persist memory atom with Gemini embedding |
| `link_memory` | `sourceHash`, `targetHash`, `relation` | Connect memories in the knowledge graph |
| `vault_store` | `key_name`, `secret_value`, `passphrase` | Encrypt and store secrets in Zero-Knowledge vault |
| `vault_retrieve` | `key_name`, `passphrase` | Decrypt vault secret in memory |
| `vault_list` | *(none)* | List stored vault key metadata |

---

## Self-Hosting

### Requirements
- **Deno** 2.0+
- **Turso Cloud** database
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
