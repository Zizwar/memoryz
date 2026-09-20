---
name: memoryz
description: Sovereign agentic memory and hierarchical multi-agent task substrate. Use to recall developer preferences and project rules in token-saving formats, share one memory across several agents with namespace isolation and provenance, coordinate hierarchical tasks with atomic claiming so two agents never duplicate work, log ephemeral traces, and store secrets in an encrypted vault.
---

# MemoryZ v3 — Sovereign Multi-Agent Memory & Task Substrate

MemoryZ is a persistent, cross-session memory substrate and task coordinator that
**several agents can share at once**. Memories are vector-embedded and ranked by
time-decayed recall, so what the team actually uses stays near the top.

Available as a CLI (`memoryz`), an MCP server, and a REST API. The commands below
use the CLI; the MCP tool name is given in parentheses where they differ.

## 1. Recall before you act

Always check for existing rules before starting a task — the developer may have
already told another agent how they want this done.

```
memoryz recall "<task topic>" --compact        # (recall_memory) one-liners, token-cheap
memoryz context "<task topic>"                 # (context_pack) memories + active tasks in one bundle
memoryz get <hash> [--links]                   # (get_memory) resolve an exact hash another agent cited
```

`recall` reinforces what it returns, so frequently-used memories rise over time.

## 2. Namespaces — keep projects apart

Every memory and task belongs to a `namespace` (default: `default`). Use one
namespace per project so agents working on different repos never see each other's
noise.

```
memoryz recall "deploy steps" --ns=my-project
memoryz task list --ns=my-project
```

Pass `--ns=` on `store`, `recall`, `task add`, and `task list`. Over MCP and REST
the field is `namespace`.

## 3. Provenance — record who wrote it

When you store something, say who you are. Later agents can then tell a human
instruction apart from a guess another agent made.

```
memoryz store --type=preference --content="<rule>" --ns=my-project --agent=<your-name>
```

Sets `agent_id` and `source` on the memory. Over MCP: `agent_id` and `source`.

## 4. Hierarchical tasks & atomic claiming

```
memoryz task list --tree                       # (task_list) compact ASCII hierarchy
memoryz task add "<title>" [--parent=<id>] [--priority=high] [--assignee=<agent>]
memoryz task claim <id> --agent=<your-name>    # (task_claim) lock it to you
memoryz task claim <id> --agent=<your-name> --release
memoryz task update <id> --status=in_progress
memoryz task done <id>
```

**Claim before you start.** `task claim` is atomic: if another agent already holds
the task the command fails and tells you who has it, so two agents never do the
same work. Release when you stop, or mark it done.

A typical handoff: agent A creates a task and stores the context as a memory, then
puts the memory hash in the task description. Agent B claims the task and calls
`memoryz get <hash>` to load exactly the context A meant.

## 5. Storing persistent memory

Store when the developer gives a durable instruction, not for transient state.

```
memoryz store --type=<type> --content="<text>" [--title="..."] [--ns=<project>]
memoryz edit <hash> --content="<corrected text>"   # (memory_update) re-embeds
memoryz forget <hash>                              # (memory_delete) soft delete
```

Types:
- `env` — ports, infrastructure, domains, CLI tool choices
- `preference` — coding habits, architectural patterns, style
- `skill` — multi-step procedures or reusable agent workflows
- `note` — reference facts, URLs, documentation pointers

Correct a wrong memory with `edit` rather than storing a second contradictory one.

## 6. Ephemeral logs

For run traces and low-importance notes. Skips vector embedding, so it is fast and
does not pollute recall.

```
memoryz log "<message>" [--level=info] [--source=<agent>]
memoryz logs --limit=20
```

## 7. Secret vault

Zero-knowledge, AES-256-GCM. Secrets are never embedded or indexed.

```
memoryz vault store --key="<name>" --secret="<val>" --pass="<passphrase>"
memoryz vault get --key="<name>" --pass="<passphrase>"
```

Never put a credential in a regular memory — use the vault.
