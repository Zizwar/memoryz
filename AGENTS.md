# Project Agent Rules

## MemoryZ v2 Agent Memory & Hierarchical Task Substrate
This project connects to MemoryZ v2 (`memoryz.wino.deno.net`):
- **Token-Saving Recall**: Use `memoryz recall "<query>" --compact` (or `--json`).
- **Prompt Context Pack**: Use `memoryz context "<query>"` to get a token-budgeted bundle of active tasks and environment rules.
- **Hierarchical Tasks / TODOs**:
  - View task tree: `memoryz task list --tree`
  - Add task or subtask: `memoryz task add "<title>" [--parent=<id>] [--assignee=<agent>]`
  - Mark completed: `memoryz task done <id>`
  - Update status: `memoryz task update <id> --status=<todo|in_progress|done|blocked>`
- **Ephemeral Logs**: Use `memoryz log "<message>"` for fast trace logs without vector overhead.
- **Persistent Rules**: Use `memoryz store --type=preference|env|skill|note --content="..."` to save persistent knowledge.
