#!/usr/bin/env -S deno run --allow-all
import { config } from "./src/config.ts";
import { initDb } from "./src/db/schema.ts";
import { AuthService } from "./src/services/auth.ts";
import { MemoryService, MemoryType } from "./src/services/memory.ts";
import { VaultService } from "./src/services/vault.ts";
import { TaskService, TaskPriority } from "./src/services/task.ts";
import { LogService, LogLevel } from "./src/services/log.ts";
import { ContextService } from "./src/services/context.ts";
import { McpServer } from "./src/mcp/server.ts";

const args = Deno.args;
const command = args[0] || "help";

// Helper to parse flags like --query="abc" or --key=xyz
function parseFlags(argsList: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (const a of argsList) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags[a.substring(2, eq)] = a.substring(eq + 1).replace(/^['"]|['"]$/g, "");
      } else {
        flags[a.substring(2)] = "true";
      }
    }
  }
  return flags;
}

const flags = parseFlags(args.slice(1));

async function getUserId(): Promise<string> {
  const apiKey = flags["key"] || Deno.env.get("MEMORYZ_API_KEY");
  if (apiKey) {
    const user = await AuthService.findByApiKey(apiKey);
    if (user) return user.id;
  }
  const stats = await AuthService.getPlatformStats();
  if (stats.users && stats.users.length > 0) {
    return stats.users[0].id;
  }
  const session = await AuthService.register("admin", "admin@memoryz.local", "MemoryZ@2026");
  console.log(`[MemoryZ] Initialized default user 'admin' (API Key: ${session.user.api_key})`);
  return session.user.id;
}

await initDb();

switch (command) {
  // --- Memory Operations ---
  case "store": {
    const type = (flags["type"] as MemoryType) || "note";
    const content = flags["content"] || args[1];
    const title = flags["title"];
    if (!content) {
      console.error("Usage: deno run -A cli.ts store --type=<note|skill|preference|env> --content='...' [--title='...']");
      Deno.exit(1);
    }
    const userId = await getUserId();
    const node = await MemoryService.store({ userId, type, content, title });
    console.log(`\x1b[32m✔ Stored memory [${node.type}] (Hash: ${node.hash.substring(0, 10)}...)\x1b[0m`);
    break;
  }

  case "recall": {
    const query = flags["query"] || args[1];
    const type = flags["type"] as MemoryType;
    const limit = flags["limit"] ? parseInt(flags["limit"], 10) : 5;
    const isCompact = flags["compact"] === "true" || flags["c"] === "true";
    const isSummary = flags["summary"] === "true";
    const isJson = flags["json"] === "true";
    const userId = await getUserId();

    const results = await MemoryService.recall({ userId, query, type, limit });

    if (isJson) {
      console.log(JSON.stringify(results, null, 2));
      break;
    }

    if (results.length === 0) {
      console.log("\x1b[90mNo memories found matching query.\x1b[0m");
      break;
    }

    if (isSummary) {
      console.log(MemoryService.formatSummary(results));
      break;
    }

    if (isCompact) {
      console.log(MemoryService.formatCompact(results));
      break;
    }

    console.log(`\x1b[36m⚡ Recalling memories for query: "${query || '(all)'}"\x1b[0m\n`);
    results.forEach((m, idx) => {
      const badge = `\x1b[35m[${m.type.toUpperCase()}]\x1b[0m`;
      console.log(`\x1b[1m#${idx + 1} ${badge} ${m.title || m.hash.substring(0, 8)}\x1b[0m (Recall: 🔥 ${m.recall_count}, Score: ⚡ ${m.recall_score})`);
      console.log(`  \x1b[37m${m.content}\x1b[0m\n`);
    });
    break;
  }

  // --- Hierarchical Task Operations ---
  case "task": {
    const sub = args[1] || "list";
    const userId = await getUserId();

    if (sub === "add" || sub === "create") {
      const title = flags["title"] || args[2];
      if (!title) {
        console.error("Usage: deno run -A cli.ts task add \"Title\" [--parent=id] [--status=todo] [--priority=medium] [--assignee=agent]");
        Deno.exit(1);
      }
      const parentId = flags["parent"] || flags["parent_id"];
      const status = flags["status"] || "todo";
      const priority = (flags["priority"] as TaskPriority) || "medium";
      const assignee = flags["assignee"];
      const description = flags["desc"] || flags["description"];

      const task = await TaskService.create({
        userId,
        title,
        parentId,
        status,
        priority,
        assignee,
        description,
      });

      console.log(`\x1b[32m✔ Task created:\x1b[0m [${task.status}] ${task.title} (ID: \x1b[36m${task.id}\x1b[0m${task.parent_id ? `, Parent: ${task.parent_id}` : ""})`);
    } else if (sub === "done" || sub === "complete") {
      const id = args[2] || flags["id"];
      if (!id) {
        console.error("Usage: deno run -A cli.ts task done <task_id>");
        Deno.exit(1);
      }
      const updated = await TaskService.update(userId, id, { status: "done" });
      console.log(`\x1b[32m✔ Task completed:\x1b[0m [✓] ${updated.title} (${updated.id})`);
    } else if (sub === "update") {
      const id = args[2] || flags["id"];
      if (!id) {
        console.error("Usage: deno run -A cli.ts task update <task_id> [--status=...] [--title=...]");
        Deno.exit(1);
      }
      const updated = await TaskService.update(userId, id, {
        status: flags["status"],
        title: flags["title"],
        description: flags["desc"] || flags["description"],
        priority: flags["priority"] as TaskPriority,
        assignee: flags["assignee"],
        parentId: flags["parent"],
      });
      console.log(`\x1b[32m✔ Task updated:\x1b[0m [${updated.status}] ${updated.title}`);
    } else if (sub === "rm" || sub === "delete") {
      const id = args[2] || flags["id"];
      if (!id) {
        console.error("Usage: deno run -A cli.ts task rm <task_id>");
        Deno.exit(1);
      }
      const cascade = flags["cascade"] !== "false";
      await TaskService.delete(userId, id, cascade);
      console.log(`\x1b[32m✔ Task '${id}' deleted.\x1b[0m`);
    } else {
      // List tasks
      const isTree = flags["tree"] === "true" || flags["t"] === "true" || (!flags["compact"] && !flags["json"]);
      const isJson = flags["json"] === "true";
      const status = flags["status"];

      if (isJson) {
        const tasks = await TaskService.list(userId, { status });
        console.log(JSON.stringify(tasks, null, 2));
      } else if (isTree) {
        const tree = await TaskService.getTree(userId, { status });
        console.log(`\x1b[1m\x1b[36m📋 Hierarchical Task Tree (${tree.length} root tasks):\x1b[0m\n`);
        const ascii = TaskService.formatTreeAscii(tree);
        console.log(ascii || "\x1b[90m(No tasks found)\x1b[0m");
      } else {
        const tasks = await TaskService.list(userId, { status });
        console.log(TaskService.formatCompactList(tasks));
      }
    }
    break;
  }

  // --- Ephemeral Logs ---
  case "log": {
    const message = flags["msg"] || flags["message"] || args.slice(1).join(" ");
    if (!message) {
      console.error("Usage: deno run -A cli.ts log \"Message text\" [--level=info] [--source=agent]");
      Deno.exit(1);
    }
    const userId = await getUserId();
    const level = (flags["level"] as LogLevel) || "info";
    const source = flags["source"] || "cli";
    const log = await LogService.append({ userId, message, level, source });
    console.log(`\x1b[32m✔ Logged [${log.level.toUpperCase()}]:\x1b[0m ${log.message}`);
    break;
  }

  case "logs": {
    const userId = await getUserId();
    const limit = flags["limit"] ? parseInt(flags["limit"], 10) : 25;
    const source = flags["source"];
    const level = flags["level"] as LogLevel;
    const isJson = flags["json"] === "true";

    const logs = await LogService.list(userId, { limit, source, level });
    if (isJson) {
      console.log(JSON.stringify(logs, null, 2));
    } else {
      console.log(`\x1b[36m📜 Recent Logs (${logs.length}):\x1b[0m\n`);
      console.log(LogService.formatCompact(logs) || "\x1b[90m(No logs found)\x1b[0m");
    }
    break;
  }

  // --- Token-Budgeted Context Pack ---
  case "context": {
    const query = flags["query"] || args[1];
    const budget = flags["tokens"] ? parseInt(flags["tokens"], 10) : 1200;
    const format = (flags["format"] as "xml" | "markdown" | "compact") || (flags["compact"] === "true" ? "compact" : "xml");
    const includeTasks = flags["no-tasks"] !== "true";
    const includeLogs = flags["logs"] === "true";
    const userId = await getUserId();

    const pack = await ContextService.buildContextPack({
      userId,
      query,
      tokenBudget: budget,
      includeTasks,
      includeLogs,
      format,
    });

    console.log(pack.content);
    break;
  }

  // --- Context Snapshots ---
  case "snapshot": {
    const sub = args[1];
    const userId = await getUserId();

    if (sub === "save") {
      const name = flags["name"] || args[2];
      const content = flags["content"] || args[3];
      if (!name || !content) {
        console.error("Usage: deno run -A cli.ts snapshot save <name> <content>");
        Deno.exit(1);
      }
      const snap = await ContextService.saveSnapshot(userId, name, content, flags["desc"]);
      console.log(`\x1b[32m✔ Saved context snapshot '${snap.name}' (${ContextService.estimateTokens(snap.content)} est. tokens)\x1b[0m`);
    } else if (sub === "get" || sub === "load") {
      const name = flags["name"] || args[2];
      if (!name) {
        console.error("Usage: deno run -A cli.ts snapshot get <name>");
        Deno.exit(1);
      }
      const snap = await ContextService.getSnapshot(userId, name);
      if (!snap) {
        console.error(`Snapshot '${name}' not found.`);
        Deno.exit(1);
      }
      console.log(snap.content);
    } else {
      const list = await ContextService.listSnapshots(userId);
      console.log(`\x1b[36m📦 Context Snapshots (${list.length}):\x1b[0m`);
      list.forEach((s) => console.log(`  • ${s.name} (${new Date(s.updated_at * 1000).toLocaleString()})`));
    }
    break;
  }

  // --- Zero-Knowledge Vault ---
  case "vault": {
    const sub = args[1];
    const userId = await getUserId();
    if (sub === "store") {
      const keyName = flags["key"] || args[2];
      const secret = flags["secret"] || args[3];
      const pass = flags["pass"] || args[4];
      if (!keyName || !secret || !pass) {
        console.error("Usage: deno run -A cli.ts vault store --key=<name> --secret=<val> --pass=<passphrase>");
        Deno.exit(1);
      }
      const res = await VaultService.storeSecret(userId, keyName, secret, pass);
      console.log(`\x1b[32m✔ Secret '${res.key_name}' encrypted & stored in Zero-Knowledge vault.\x1b[0m`);
      if (res.recoveryKey) {
        console.log(`\x1b[33m⚠️ One-time recovery key (SAVE THIS!): ${res.recoveryKey}\x1b[0m`);
      }
    } else if (sub === "get") {
      const keyName = flags["key"] || args[2];
      const pass = flags["pass"] || args[3];
      if (!keyName || !pass) {
        console.error("Usage: deno run -A cli.ts vault get --key=<name> --pass=<passphrase>");
        Deno.exit(1);
      }
      try {
        const val = await VaultService.retrieveSecret(userId, keyName, pass);
        console.log(`\x1b[32m✔ Decrypted '${keyName}':\x1b[0m ${val}`);
      } catch (err) {
        console.error(`\x1b[31m✘ Failed: ${(err as Error).message}\x1b[0m`);
      }
    } else if (sub === "list") {
      const list = await VaultService.listKeys(userId);
      console.log(`\x1b[36m🔐 Vault Keys (${list.length}):\x1b[0m`);
      list.forEach((k) => console.log(`  • ${k.key_name} (Created: ${new Date(k.created_at * 1000).toLocaleString()})`));
    }
    break;
  }

  // --- Stdio MCP Bridge ---
  case "mcp": {
    const userId = await getUserId();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    for await (const chunk of Deno.stdin.readable) {
      buffer += decoder.decode(chunk);
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const req = JSON.parse(line);
          const res = await McpServer.handleRpc(userId, req);
          if (res !== null) {
            await Deno.stdout.write(encoder.encode(JSON.stringify(res) + "\n"));
          }
        } catch (_err) {
          // ignore parse errors
        }
      }
    }
    break;
  }

  case "help":
  default:
    console.log(`
\x1b[1m\x1b[36mMemoryZ v2 CLI — Sovereign Agentic Memory & Task Substrate\x1b[0m

\x1b[1mTask Management (Hierarchical & Multi-Agent):\x1b[0m
  \x1b[33mtask list\x1b[0m     [--tree] [--status=active|todo|done] [--json]
                 Display tasks as an ultra-compact, token-efficient hierarchy tree.
  \x1b[33mtask add\x1b[0m      "<Title>" [--parent=<id>] [--status=todo] [--priority=medium] [--assignee=agent]
                 Create a root task or nested child subtask.
  \x1b[33mtask done\x1b[0m     <task_id>
                 Quickly mark a task completed.
  \x1b[33mtask update\x1b[0m   <task_id> [--status=...] [--title=...] [--assignee=...]
                 Update status, title, assignee, or priority.
  \x1b[33mtask rm\x1b[0m       <task_id> [--cascade=true]
                 Delete task and optionally its descendants.

\x1b[1mMemory Operations:\x1b[0m
  \x1b[33mrecall\x1b[0m        [--query="..."] [--compact] [--summary] [--limit=5]
                 Semantic vector recall with time-decay scoring.
  \x1b[33mstore\x1b[0m         --type=env|skill|preference|note --content="..." [--title="..."]
                 Store a memory atom with automatic 768-dim Gemini vector embedding.

\x1b[1mEphemeral Logs & Scratchpads:\x1b[0m
  \x1b[33mlog\x1b[0m           "<Message>" [--level=info] [--source=agent]
                 Fast lightweight logging without heavy embeddings.
  \x1b[33mlogs\x1b[0m          [--limit=25] [--source=...]
                 View recent ephemeral agent logs.

\x1b[1mToken-Budgeted Context Packs & Snapshots:\x1b[0m
  \x1b[33mcontext\x1b[0m       ["<query>"] [--tokens=1200] [--compact|--markdown]
                 Generate dense, token-budgeted prompt context (tasks + memories).
  \x1b[33msnapshot\x1b[0m      save <name> "<content>" | get <name> | list
                 Save or restore complete context checkpoints.

\x1b[1mZero-Knowledge Secret Vault:\x1b[0m
  \x1b[33mvault\x1b[0m         store --key="<name>" --secret="<val>" --pass="<pass>"
  \x1b[33mvault\x1b[0m         get --key="<name>" --pass="<pass>"
  \x1b[33mvault\x1b[0m         list

\x1b[1mMCP Protocol:\x1b[0m
  \x1b[33mmcp\x1b[0m           Run standard MCP JSON-RPC protocol over stdio for Cursor / Claude Code.
`);
    break;
}
