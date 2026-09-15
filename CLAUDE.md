# Claude Assistant Guidelines

# Memory & Task Substrate (MemoryZ v2)
- Query past preferences (compact): `memoryz recall "<query>" --compact`
- Inject task context & active tree: `memoryz context "<query>"`
- Task Tree Management:
  - List hierarchy: `memoryz task list --tree`
  - Create task/subtask: `memoryz task add "<title>" [--parent=<id>]`
  - Complete task: `memoryz task done <id>`
- Store persistent rules: `memoryz store --type=preference --content="..."`
- Ephemeral trace log: `memoryz log "<message>"`
