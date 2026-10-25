# Claude Assistant Guidelines

# Memory & Task Substrate (MemoryZ v2)
- Query past preferences (compact): `memoryz recall "<query>" --compact`
- Inject task context & active tree: `memoryz context "<query>"`
- Task Tree Management:
  - List hierarchy: `memoryz task list --tree`
  - Create task/subtask: `memoryz task add "<title>" [--parent=<id>]`
  - Complete task: `memoryz task done <id>`
- Store persistent rules: `memoryz store --type=preference --content="..."`
- **Zero-Leak Security Rule**: NEVER store plaintext passwords, tokens, or API keys in memories/skills. Always store credentials encrypted in the vault via `memoryz vault store --key="..." --secret="..." --pass="..."` and reference by key name only.
- Ephemeral trace log: `memoryz log "<message>"`
