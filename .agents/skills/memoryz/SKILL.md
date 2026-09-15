---
name: memoryz
description: Sovereign Agentic Memory & Hierarchical Task Substrate. Use to recall developer preferences with token-saving formats, manage hierarchical multi-agent tasks, log ephemeral traces, and store persistent instructions.
---

# MemoryZ v2 — Sovereign Agentic Memory & Task Substrate

MemoryZ v2 gives you a persistent, living cross-session memory substrate and hierarchical task coordinator.

## 1. Token-Saving Memory Recall
- Before starting a task, check developer rules or environment specs:
  `memoryz recall "<task topic>" --compact`
  OR dense prompt bundle (tasks + memories):
  `memoryz context "<task topic>"`

## 2. Hierarchical Tasks & Multi-Agent TODOs
- View current tasks as an ultra-compact ASCII tree:
  `memoryz task list --tree`
- Create a root task or nested child subtask:
  `memoryz task add "<title>" [--parent=<id>] [--priority=high] [--assignee=<agent>]`
- Mark a task done:
  `memoryz task done <id>`
- Update task status:
  `memoryz task update <id> --status=in_progress`

## 3. Ephemeral Logs & Scratchpad
- For temporary execution notes, run traces, or low-importance logs (skips vector embedding):
  `memoryz log "<message>" [--level=info] [--source=agent]`
  `memoryz logs --limit=20`

## 4. When to Store Persistent Memory
- When the developer gives durable instructions or preferences:
  `memoryz store --type=preference --content="<rule text>"`
  Types:
  - `env`: Ports, infrastructure, domains, CLI tool choices.
  - `preference`: Coding habits, architectural patterns, styles.
  - `skill`: Multi-step procedure prompts or custom agent workflows.
  - `note`: Reference facts, URLs, documentation pointers.

## 5. Secret Vault
- For credentials and API keys:
  `memoryz vault store --key="<name>" --secret="<val>" --pass="<passphrase>"`
  `memoryz vault get --key="<name>" --pass="<passphrase>"`
