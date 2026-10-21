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
- **Cloudflare R2 Object & File Storage**:
  - Upload file/image: Use MCP `r2_upload` with `key` and either `base64` (for binary/images) or `content` (for text/JSON). Returns direct CDN link (`full_url`) and ready-to-embed `markdown_link`.
  - Fetch/List files: Use MCP `r2_list`, `r2_get_url`, or `r2_download`.
  - Direct public access: `https://memoryz.wino.deno.net/api/r2/raw/<key>?bucket=memoryz`.
