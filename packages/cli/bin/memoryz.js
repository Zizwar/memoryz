#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const DEFAULT_SERVER_URL = "https://memoryz.wino.deno.net";
const CONFIG_DIR = path.join(os.homedir(), ".memoryz");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// CLI colors
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  purple: "\x1b[35m",
  red: "\x1b[31m",
  dim: "\x1b[90m",
};

// Parse command line arguments and flags
const args = process.argv.slice(2);
const flags = {};
const positionals = [];

for (const arg of args) {
  if (arg.startsWith("--")) {
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      flags[arg.substring(2, eq)] = arg.substring(eq + 1).replace(/^['"]|['"]$/g, "");
    } else {
      flags[arg.substring(2)] = true;
    }
  } else {
    positionals.push(arg);
  }
}

function loadSavedConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch (_e) {}
  return {};
}

function saveConfig(data) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const current = loadSavedConfig();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...data }, null, 2), "utf8");
  } catch (_e) {}
}

const saved = loadSavedConfig();
const token = flags.token || flags.key || process.env.MEMORYZ_TOKEN || process.env.MEMORYZ_API_KEY || saved.token;
const serverUrl = (flags.url || process.env.MEMORYZ_URL || saved.url || DEFAULT_SERVER_URL).replace(/\/$/, "");

// Determine command
let command = positionals[0] || (flags.token ? "init" : "help");
if (command === "--help" || command === "-h") command = "help";

async function main() {
  switch (command) {
    case "init":
    case "setup":
      await runInit();
      break;

    case "recall":
    case "search":
      await runRecall();
      break;

    case "store":
    case "save":
      await runStore();
      break;

    case "vault":
      await runVault();
      break;

    case "mcp":
      await runMcpBridge();
      break;

    case "help":
    default:
      showHelp();
      break;
  }
}

async function runInit() {
  console.log(`\n${c.bold}${c.cyan}🧠 MemoryZ — Auto-Configurator & Installer${c.reset}\n`);

  if (!token) {
    console.error(`${c.red}✘ Error: Missing --token flag.${c.reset}`);
    console.error(`\nUsage:\n  npx memoryz init --token=<YOUR_API_KEY>\n`);
    console.log(`Get your key from: ${c.cyan}${serverUrl}${c.reset}\n`);
    process.exit(1);
  }

  const mcpEndpoint = `${serverUrl}/mcp?token=${token}`;
  console.log(`${c.dim}Validating connection to MemoryZ Substrate...${c.reset}`);

  try {
    const checkRes = await fetch(mcpEndpoint);
    if (!checkRes.ok && checkRes.status !== 200) {
      console.warn(`${c.yellow}⚠️ Note: Server responded with status ${checkRes.status}. Continuing setup...${c.reset}`);
    } else {
      console.log(`${c.green}✔ Connected to MemoryZ Substrate successfully!${c.reset}`);
    }
  } catch (err) {
    console.warn(`${c.yellow}⚠️ Connection warning (${err.message}). Writing local configuration anyway...${c.reset}`);
  }

  // Save token locally
  saveConfig({ token, url: serverUrl });

  const home = os.homedir();
  const configured = [];

  // Helper to safely merge mcpServers in json config files
  function updateMcpConfigFile(filePath, label) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      let json = {};
      if (fs.existsSync(filePath)) {
        try {
          json = JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (_e) {
          json = {};
        }
      }

      json.mcpServers = json.mcpServers || {};
      json.mcpServers.memoryz = {
        url: mcpEndpoint,
      };

      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
      configured.push(`${label} (${filePath})`);
    } catch (err) {
      console.warn(`${c.yellow}Could not write to ${filePath}: ${err.message}${c.reset}`);
    }
  }

  // 1. Cursor (~/.cursor/mcp.json)
  const cursorConfig = path.join(home, ".cursor", "mcp.json");
  updateMcpConfigFile(cursorConfig, "Cursor");

  // 2. Claude Desktop
  let claudeDesktopConfig = "";
  if (process.platform === "darwin") {
    claudeDesktopConfig = path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else if (process.platform === "win32") {
    claudeDesktopConfig = path.join(process.env.APPDATA || "", "Claude", "claude_desktop_config.json");
  } else {
    claudeDesktopConfig = path.join(home, ".config", "Claude", "claude_desktop_config.json");
  }
  updateMcpConfigFile(claudeDesktopConfig, "Claude Desktop");

  // 3. Claude Code (~/.claude/mcp.json)
  const claudeCodeConfig = path.join(home, ".claude", "mcp.json");
  updateMcpConfigFile(claudeCodeConfig, "Claude Code");

  // 4. Windsurf (~/.codeium/windsurf/mcp_config.json)
  const windsurfConfig = path.join(home, ".codeium", "windsurf", "mcp_config.json");
  updateMcpConfigFile(windsurfConfig, "Windsurf");

  // 5. Current project .mcp.json
  const projectMcp = path.join(process.cwd(), ".mcp.json");
  updateMcpConfigFile(projectMcp, "Current Project (.mcp.json)");

  console.log(`\n${c.bold}${c.green}✔ MemoryZ MCP Server successfully registered for:${c.reset}`);
  configured.forEach((item) => console.log(`  ${c.cyan}• ${item}${c.reset}`));

  console.log(`\n${c.bold}MCP Endpoint:${c.reset} ${c.purple}${mcpEndpoint}${c.reset}`);
  console.log(`\n${c.green}✨ Done! Your AI assistants (Claude, Cursor, Windsurf) can now store & recall memories automatically.${c.reset}\n`);
}

async function runRecall() {
  if (!token) {
    console.error(`${c.red}✘ Error: No token found. Run 'npx memoryz init --token=...' first.${c.reset}`);
    process.exit(1);
  }
  const query = positionals.slice(1).join(" ") || flags.query || "";
  const type = flags.type || "";
  const limit = flags.limit || 5;

  const url = new URL(`${serverUrl}/api/memories/recall`);
  if (query) url.searchParams.set("query", query);
  if (type) url.searchParams.set("type", type);
  url.searchParams.set("limit", String(limit));

  console.log(`\n${c.cyan}⚡ Recalling memories for: "${query || "(all)"}"...${c.reset}\n`);

  try {
    const res = await fetch(url, {
      headers: { "X-API-Key": token },
    });
    const data = await res.json();
    const memories = data.memories || [];

    if (memories.length === 0) {
      console.log(`${c.dim}No memories found matching query.${c.reset}\n`);
      return;
    }

    memories.forEach((m, idx) => {
      const badge = `${c.purple}[${m.type.toUpperCase()}]${c.reset}`;
      const title = m.title ? `${c.bold}${m.title}${c.reset}` : `${c.dim}${m.hash.substring(0, 8)}${c.reset}`;
      console.log(`#${idx + 1} ${badge} ${title} ${c.dim}(Recall: 🔥 ${m.recall_count}, Score: ⚡ ${m.recall_score || 0})${c.reset}`);
      console.log(`  ${m.content}\n`);
    });
  } catch (err) {
    console.error(`${c.red}Error recalling memories: ${err.message}${c.reset}`);
  }
}

async function runStore() {
  if (!token) {
    console.error(`${c.red}✘ Error: No token found. Run 'npx memoryz init --token=...' first.${c.reset}`);
    process.exit(1);
  }
  const content = flags.content || positionals.slice(1).join(" ");
  const type = flags.type || "note";
  const title = flags.title || undefined;

  if (!content) {
    console.error(`${c.red}✘ Usage: npx memoryz store --type=env|skill|preference|note --content="..." [--title="..."]${c.reset}`);
    process.exit(1);
  }

  try {
    const res = await fetch(`${serverUrl}/api/memories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": token,
      },
      body: JSON.stringify({ type, content, title }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Memory atom stored successfully! [${data.type}] (Hash: ${data.hash.substring(0, 10)}...)${c.reset}\n`);
    } else {
      console.error(`${c.red}✘ Failed to store memory: ${data.error || "Unknown error"}${c.reset}`);
    }
  } catch (err) {
    console.error(`${c.red}✘ Network error: ${err.message}${c.reset}`);
  }
}

async function runVault() {
  if (!token) {
    console.error(`${c.red}✘ Error: No token found. Run 'npx memoryz init --token=...' first.${c.reset}`);
    process.exit(1);
  }
  const sub = positionals[1];

  if (sub === "get") {
    const keyName = flags.key || positionals[2];
    const pass = flags.pass || flags.passphrase || positionals[3];
    if (!keyName || !pass) {
      console.error(`Usage: npx memoryz vault get --key=<name> --pass=<passphrase>`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/vault/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": token },
      body: JSON.stringify({ key_name: keyName, passphrase: pass }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Decrypted '${keyName}':${c.reset} ${data.secret_value}\n`);
    } else {
      console.error(`\n${c.red}✘ Failed: ${data.error || "Decryption failed"}${c.reset}\n`);
    }
  } else if (sub === "store") {
    const keyName = flags.key || positionals[2];
    const secret = flags.secret || positionals[3];
    const pass = flags.pass || flags.passphrase || positionals[4];
    if (!keyName || !secret || !pass) {
      console.error(`Usage: npx memoryz vault store --key=<name> --secret=<val> --pass=<passphrase>`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/vault`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": token },
      body: JSON.stringify({ key_name: keyName, secret_value: secret, passphrase: pass }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Secret '${keyName}' encrypted and stored in Zero-Knowledge vault!${c.reset}`);
      if (data.recoveryKey) {
        console.log(`\n${c.yellow}⚠️ ONE-TIME RECOVERY KEY (SAVE THIS!): ${data.recoveryKey}${c.reset}\n`);
      }
    } else {
      console.error(`\n${c.red}✘ Failed: ${data.error}${c.reset}\n`);
    }
  } else {
    // List vault handles
    const res = await fetch(`${serverUrl}/api/vault`, {
      headers: { "X-API-Key": token },
    });
    const data = await res.json();
    const keys = data.keys || [];
    console.log(`\n${c.cyan}🔐 Vault Secrets (${keys.length}):${c.reset}`);
    keys.forEach((k) => console.log(`  • ${k.key_name} ${c.dim}(${new Date(k.created_at * 1000).toLocaleDateString()})${c.reset}`));
    console.log("");
  }
}

async function runMcpBridge() {
  // Stdio bridge forwarding to remote MCP HTTP endpoint
  if (!token) {
    process.stderr.write("Error: Missing token for MCP bridge.\n");
    process.exit(1);
  }

  const endpoint = `${serverUrl}/mcp?token=${token}`;
  let buffer = "";

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", async (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: line,
        });
        if (res.status === 204) continue;
        const json = await res.json();
        process.stdout.write(JSON.stringify(json) + "\n");
      } catch (err) {
        process.stderr.write("Bridge error: " + err.message + "\n");
      }
    }
  });
}

function showHelp() {
  console.log(`
${c.bold}${c.cyan}MemoryZ CLI — Sovereign Agentic Memory Substrate${c.reset}

${c.bold}Usage:${c.reset}
  ${c.green}npx memoryz init --token=<YOUR_TOKEN>${c.reset}
      Auto-detect and register MemoryZ in Cursor, Claude Desktop, Claude Code, Windsurf.

  ${c.green}npx memoryz recall "<query>"${c.reset}
      Semantic vector recall with time-decay scoring.

  ${c.green}npx memoryz store --type=env|skill|preference|note --content="..." [--title="..."]${c.reset}
      Store a memory atom with automatic 768-dim Gemini vector embedding.

  ${c.green}npx memoryz vault store --key="..." --secret="..." --pass="..."${c.reset}
      Encrypt and store confidential secret in Zero-Knowledge vault.

  ${c.green}npx memoryz vault get --key="..." --pass="..."${c.reset}
      Decrypt secret on-the-fly in process memory.

  ${c.green}npx memoryz mcp${c.reset}
      Run stdio bridge for local agent integration.

${c.bold}Options:${c.reset}
  --token=<key>    MemoryZ API Key or JWT token
  --url=<url>      MemoryZ Server URL (default: ${DEFAULT_SERVER_URL})
`);
}

main().catch((err) => {
  console.error(`${c.red}Fatal: ${err.message}${c.reset}`);
  process.exit(1);
});
