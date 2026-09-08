#!/usr/bin/env -S deno run --allow-all
import { config } from "./src/config.ts";
import { initDb } from "./src/db/schema.ts";
import { AuthService } from "./src/services/auth.ts";
import { MemoryService, MemoryType } from "./src/services/memory.ts";
import { VaultService } from "./src/services/vault.ts";
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
  // If API key passed
  const apiKey = flags["key"] || Deno.env.get("MEMORYZ_API_KEY");
  if (apiKey) {
    const user = await AuthService.findByApiKey(apiKey);
    if (user) return user.id;
  }
  // Fallback: look for first user or default admin user
  const stats = await AuthService.getPlatformStats();
  if (stats.users && stats.users.length > 0) {
    return stats.users[0].id;
  }
  // If no user exists, create default admin
  const session = await AuthService.register("admin", "admin@memoryz.local", "MemoryZ@2026");
  console.log(`[MemoryZ] Initialized default user 'admin' (API Key: ${session.user.api_key})`);
  return session.user.id;
}

await initDb();

switch (command) {
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
    const userId = await getUserId();

    console.log(`\x1b[36m⚡ Recalling memories for query: "${query || '(all)'}"\x1b[0m\n`);
    const results = await MemoryService.recall({ userId, query, type, limit });

    if (results.length === 0) {
      console.log("\x1b[90mNo memories found matching query.\x1b[0m");
    } else {
      results.forEach((m, idx) => {
        const badge = `\x1b[35m[${m.type.toUpperCase()}]\x1b[0m`;
        console.log(`\x1b[1m#${idx + 1} ${badge} ${m.title || m.hash.substring(0, 8)}\x1b[0m (Recall: 🔥 ${m.recall_count}, Score: ⚡ ${m.recall_score})`);
        console.log(`  \x1b[37m${m.content}\x1b[0m\n`);
      });
    }
    break;
  }

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

  case "mcp": {
    // Stdio MCP transport for direct terminal agents
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
          await Deno.stdout.write(encoder.encode(JSON.stringify(res) + "\n"));
        } catch (_err) {
          // ignore parse errors on stdin
        }
      }
    }
    break;
  }

  case "help":
  default:
    console.log(`
\x1b[1m\x1b[36mMemoryZ CLI — Sovereign Agentic Memory Substrate\x1b[0m

\x1b[1mCommands:\x1b[0m
  \x1b[33mrecall\x1b[0m  --query="..." [--type=env|skill|preference|note] [--limit=5]
          Semantic vector recall with time-decay scoring.

  \x1b[33mstore\x1b[0m   --type=env|skill|preference|note --content="..." [--title="..."]
          Store a memory atom with automatic 768-dim Gemini vector embedding.

  \x1b[33mvault\x1b[0m   store --key="<name>" --secret="<val>" --pass="<pass>"
          Encrypt and store confidential secret in zero-knowledge vault.

  \x1b[33mvault\x1b[0m   get --key="<name>" --pass="<pass>"
          Decrypt secret on-the-fly in process memory.

  \x1b[33mvault\x1b[0m   list
          List stored secret handles.

  \x1b[33mmcp\x1b[0m     Run standard MCP JSON-RPC protocol over stdio for Cursor / Claude Code.
`);
    break;
}
