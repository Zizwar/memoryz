---
name: memoryz
description: Sovereign Agentic Memory Substrate. Use to automatically recall developer preferences, system environment rules, port allocations, and store new persistent instructions.
---

# MemoryZ — Sovereign Agentic Memory Substrate

MemoryZ gives you a persistent, living cross-session memory substrate.
Use it to recall developer preferences and store new knowledge.

## When to Recall Memory
- Before starting a task: check if the developer has specific rules, preferred tools, ports, or libraries.
- Execute command in terminal:
  `memoryz recall "<task topic>" --json`
  OR
  `memoryz context "<task topic>"`

## When to Store Memory
- When the developer gives instructions or preferences (e.g., "I prefer PM2", "Port 3333 is for test domain").
- Execute command:
  `memoryz store --type=preference --content="<rule text>"`
  Types:
  - `env`: Ports, infrastructure, domains, CLI tool choices.
  - `preference`: Coding habits, architectural patterns, styles.
  - `skill`: Multi-step procedure prompts or custom agent workflows.
  - `note`: Facts, URLs, references.

## Secret Vault
- For credentials and API keys (never store plaintext secrets in notes):
  `memoryz vault store --key="<name>" --secret="<val>" --pass="<passphrase>"`
  `memoryz vault get --key="<name>" --pass="<passphrase>"`
