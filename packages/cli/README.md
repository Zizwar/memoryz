# MemoryZ

Persistent agentic memory substrate and Model Context Protocol (MCP) client for AI coding assistants, terminal agents, and developer workflows.

MemoryZ provides cross-session memory for tools like **Cursor**, **Claude Code**, **Windsurf**, and custom LLM agents. It pairs vector-based semantic retrieval with time-decay scoring, an isolated Zero-Knowledge vault for sensitive credentials, and automatic configuration for agent environments.

---

## Features

- **Semantic Vector Recall:** 768-dimensional embeddings with cosine distance search, weighted by a recency-decay scoring function:
  $$\text{score} = \text{recall\_count} \times e^{-\lambda \times \Delta t}$$
- **Categorized Memory Atoms:**
  - `env`: Ports, infrastructure flags, local domains, process managers.
  - `preference`: Developer coding styles, formatting preferences, library choices.
  - `skill`: Multi-step agent workflows, procedures, prompt templates.
  - `note`: Reference snippets, architectural notes, documentation pointers.
- **Zero-Knowledge Vault:** Isolated credential storage using client-side **AES-256-GCM** encryption and **PBKDF2** key derivation (100,000 rounds). Decryption occurs exclusively in transient process memory.
- **Agent Environment Auto-Configuration:** Automatically discovers and registers MCP endpoints across Cursor, Claude Desktop, Claude Code, and Windsurf, and generates standard `SKILL.md` and `AGENTS.md` definitions.
- **Context Injection:** Formats recalled memories directly into structured XML blocks (`<memoryz_context>`) ready for prompt injection.
- **Polyglot Clients:** Usable via CLI (`npx memoryz`), Node.js/TypeScript SDK, Python standard library client, or POSIX shell helpers.

---

## Quickstart

### 1. Initialize and Auto-Configure Editors

Run the initialization command with your MemoryZ token to configure local MCP clients:

```bash
npx memoryz init --token=<YOUR_MEMORYZ_TOKEN>
```

This command:
1. Verifies connectivity to the MemoryZ server.
2. Registers the MCP endpoint in `~/.cursor/mcp.json`, Claude Desktop config, Claude Code (`~/.claude/mcp.json`), and Windsurf (`~/.codeium/windsurf/mcp_config.json`).
3. Saves credentials locally in `~/.memoryz/config.json`.
4. Generates `.agents/skills/memoryz/SKILL.md`, `CLAUDE.md`, and `AGENTS.md` for terminal agents.

---

## CLI Usage

### Recall Memories
Query stored knowledge using natural language:

```bash
# Formatted terminal output
memoryz recall "database port and connection rules"

# Raw JSON output for pipelines and AI tools
memoryz recall "PM2 deployment" --json --limit=3
```

### Store Knowledge Atoms
Persist new rules or configurations from the terminal:

```bash
# Store a developer preference
memoryz store --type=preference --content="Always use TypeScript strict mode with no implicit any"

# Store an environment variable or port definition
memoryz store --type=env --content="Staging service runs on port 4000" --title="staging_port"

# Pass content via stdin pipe
git diff | memoryz store --type=note --title="recent_refactor_notes"
```

### Prompt Context Injection
Output an XML-formatted context block directly into LLM prompts or shell wrappers:

```bash
memoryz context "API authentication"
```

Output:
```xml
<memoryz_context>
  <memory type="env" title="staging_port" score="12">
    Staging service runs on port 4000
  </memory>
  <memory type="preference" title="typescript_rules" score="8">
    Always use TypeScript strict mode with no implicit any
  </memory>
</memoryz_context>
```

### Zero-Knowledge Secret Vault
Encrypt and retrieve secrets client-side:

```bash
# Encrypt and store a secret
memoryz vault store --key="stripe_webhook_secret" --secret="whsec_12345" --pass="my-passphrase"

# Decrypt in memory
memoryz vault get --key="stripe_webhook_secret" --pass="my-passphrase"

# List stored vault keys (metadata only)
memoryz vault list
```

### Agent Skill Generation
Export agent skills and rules to the current workspace or globally:

```bash
# Local workspace (.agents/skills/memoryz/SKILL.md, AGENTS.md, CLAUDE.md)
memoryz skill

# Global installation (~/.agents/skills/memoryz/SKILL.md)
memoryz skill --global
```

### Stdio MCP Bridge
Run the MCP server over standard input/output for local client integrations:

```bash
memoryz mcp
```

---

## Programmatic SDK Usage

### Node.js / TypeScript

```javascript
import { recall, store, getContext, vaultGet } from "memoryz";

// Recall memories
const memories = await recall("test database config", { limit: 5 });

// Store memory
await store({
  type: "env",
  title: "redis_port",
  content: "Local Redis instance operates on port 6380",
});

// Generate XML context string
const xmlContext = await getContext("payment processing");

// Decrypt vault secret
const secret = await vaultGet({
  keyName: "stripe_webhook_secret",
  passphrase: "my-passphrase",
});
```

### Python (Zero-Dependency Micro-Client)

The Python client requires only the standard library (`urllib` and `json`):

```python
import memoryz

# Recall matching memories
memories = memoryz.recall("coding style")

# Generate XML context for LLM prompt
prompt_context = memoryz.get_context("database migration")

# Store new memory
memoryz.store("Use port 3333 for test server", memory_type="env")
```

### POSIX Shell / Bash

```bash
source <(curl -s https://memoryz.wino.deno.net/client.sh)

memoryz_recall "port allocation"
memoryz_store "preference" "Prefer pnpm over npm"
```

---

## Configuration

MemoryZ reads credentials from the following sources in order of precedence:

1. CLI flag: `--token=<TOKEN>`
2. Environment variables: `MEMORYZ_API_KEY` or `MEMORYZ_TOKEN`
3. Local config file: `~/.memoryz/config.json`

Server URL defaults to `https://memoryz.wino.deno.net` and can be overridden with `--url=<URL>` or `MEMORYZ_URL`.

### Example `~/.memoryz/config.json`

```json
{
  "token": "mz_your_token_here",
  "url": "https://memoryz.wino.deno.net"
}
```

---

## MCP Server Specification

MemoryZ implements the **Model Context Protocol (MCP)** specification and provides the following tools:

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `recall_memory` | `query`, `type`, `limit` | Semantic vector search across stored memory atoms |
| `store_memory` | `type`, `content`, `title` | Persists a memory atom with automatic Gemini embedding |
| `link_memory` | `sourceHash`, `targetHash`, `relation` | Connects memories in the knowledge graph |
| `vault_store` | `key_name`, `secret_value`, `passphrase` | Encrypts and stores confidential secrets |
| `vault_retrieve` | `key_name`, `passphrase` | Decrypts a vault secret in memory |
| `vault_list` | *(none)* | Lists stored secret names and creation dates |

---

## License

MIT
