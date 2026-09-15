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

async function readStdin() {
  if (process.stdin.isTTY) return "";
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data.trim());
    });
  });
}

// Determine command
let command = positionals[0] || (flags.token ? "init" : "help");
if (command === "--help" || command === "-h") command = "help";

const saved = loadSavedConfig();
const token =
  flags.token ||
  flags.apiKey ||
  flags["api-key"] ||
  (command !== "vault" ? flags.key : null) ||
  process.env.MEMORYZ_TOKEN ||
  process.env.MEMORYZ_API_KEY ||
  saved.token;
const serverUrl = (flags.url || process.env.MEMORYZ_URL || saved.url || DEFAULT_SERVER_URL).replace(/\/$/, "");

async function main() {
  switch (command) {
    case "init":
    case "setup":
      await runInit();
      break;

    case "task":
    case "tasks":
      await runTask();
      break;

    case "log":
    case "logs":
      await runLog();
      break;

    case "snapshot":
    case "snapshots":
      await runSnapshot();
      break;

    case "recall":
    case "search":
      await runRecall();
      break;

    case "store":
    case "save":
      await runStore();
      break;

    case "context":
      await runContext();
      break;

    case "skill":
      await runSkill();
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
  console.log(`\n${c.bold}${c.cyan}🧠 MemoryZ — Auto-Configurator & Agent Installer${c.reset}\n`);

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

  // 6. Generate Agent Skill & Rules in current workspace
  await runSkill(true);

  console.log(`\n${c.bold}${c.green}✔ MemoryZ MCP Server successfully registered for:${c.reset}`);
  configured.forEach((item) => console.log(`  ${c.cyan}• ${item}${c.reset}`));

  console.log(`\n${c.bold}MCP Endpoint:${c.reset} ${c.purple}${mcpEndpoint}${c.reset}`);
  console.log(`\n${c.green}✨ Done! Your AI assistants (Claude, Cursor, Windsurf) can now store & recall memories automatically.${c.reset}\n`);
}

async function runTask() {

  if (!token) {
    console.error(`${c.red}✘ Error: No token found. Run 'npx memoryz init --token=...' first.${c.reset}`);
    process.exit(1);
  }
  const sub = positionals[1] || (flags.tree ? "list" : "list");

  if (sub === "add" || sub === "create") {
    const title = flags.title || positionals.slice(2).join(" ");
    if (!title) {
      console.error(`${c.red}✘ Usage: npx memoryz task add "Title" [--parent=id] [--status=todo] [--priority=medium] [--assignee=agent]${c.reset}`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": token },
      body: JSON.stringify({
        title,
        parent_id: flags.parent || flags.parentId,
        status: flags.status || "todo",
        priority: flags.priority || "medium",
        assignee: flags.assignee,
        description: flags.desc || flags.description,
      }),
    });
    const data = await res.json();
    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    if (res.ok) {
      console.log(`\n${c.green}✔ Task created:${c.reset} [${data.status}] ${data.title} (${c.cyan}${data.id}${c.reset}${data.parent_id ? `, Parent: ${data.parent_id}` : ""})\n`);
    } else {
      console.error(`${c.red}✘ Failed to create task: ${data.error}${c.reset}`);
    }
  } else if (sub === "done" || sub === "complete") {
    const id = flags.id || positionals[2];
    if (!id) {
      console.error(`${c.red}✘ Usage: npx memoryz task done <task_id>${c.reset}`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-API-Key": token },
      body: JSON.stringify({ status: "done" }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Task completed:${c.reset} [✓] ${data.title} (${data.id})\n`);
    } else {
      console.error(`${c.red}✘ Failed: ${data.error}${c.reset}`);
    }
  } else if (sub === "update") {
    const id = flags.id || positionals[2];
    if (!id) {
      console.error(`${c.red}✘ Usage: npx memoryz task update <task_id> [--status=...] [--title=...]${c.reset}`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-API-Key": token },
      body: JSON.stringify({
        status: flags.status,
        title: flags.title,
        description: flags.desc || flags.description,
        priority: flags.priority,
        assignee: flags.assignee,
        parent_id: flags.parent,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Task updated:${c.reset} [${data.status}] ${data.title}\n`);
    } else {
      console.error(`${c.red}✘ Failed: ${data.error}${c.reset}`);
    }
  } else if (sub === "rm" || sub === "delete") {
    const id = flags.id || positionals[2];
    if (!id) {
      console.error(`${c.red}✘ Usage: npx memoryz task rm <task_id>${c.reset}`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/tasks/${id}?cascade=${flags.cascade !== false}`, {
      method: "DELETE",
      headers: { "X-API-Key": token },
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Task '${id}' deleted.${c.reset}\n`);
    } else {
      console.error(`${c.red}✘ Failed: ${data.error}${c.reset}`);
    }
  } else {
    // List / Tree
    const url = new URL(`${serverUrl}/api/tasks`);
    if (flags.status) url.searchParams.set("status", flags.status);
    if (flags.parent) url.searchParams.set("parent_id", flags.parent);
    if (flags.assignee) url.searchParams.set("assignee", flags.assignee);
    if (flags.tree || (!flags.compact && !flags.json)) {
      url.searchParams.set("format", "tree");
    } else if (flags.compact) {
      url.searchParams.set("format", "compact");
    }

    const res = await fetch(url, { headers: { "X-API-Key": token } });
    const data = await res.json();

    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    if (data.ascii) {
      console.log(`\n${c.bold}${c.cyan}📋 Hierarchical Task Tree (${data.total_roots} roots):${c.reset}\n`);
      console.log(data.ascii || `${c.dim}(No tasks found)${c.reset}`);
      console.log("");
    } else if (data.formatted) {
      console.log(`\n${data.formatted}\n`);
    } else if (data.tasks) {
      data.tasks.forEach((t) => {
        console.log(`• [${t.status}] ${t.title} (${t.id})`);
      });
    }
  }
}

async function runLog() {
  if (!token) {
    console.error(`${c.red}✘ Error: No token found.${c.reset}`);
    process.exit(1);
  }
  const sub = positionals[1];
  if (sub === "list" || command === "logs") {
    const url = new URL(`${serverUrl}/api/logs`);
    if (flags.limit) url.searchParams.set("limit", String(flags.limit));
    if (flags.level) url.searchParams.set("level", flags.level);
    if (flags.source) url.searchParams.set("source", flags.source);
    if (flags.compact || !flags.json) url.searchParams.set("format", "compact");

    const res = await fetch(url, { headers: { "X-API-Key": token } });
    const data = await res.json();
    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log(`\n${c.cyan}📜 Recent Ephemeral Logs (${data.count || 0}):${c.reset}\n`);
    console.log(data.formatted || `${c.dim}(No logs)${c.reset}\n`);
  } else {
    const message = flags.msg || flags.message || positionals.slice(1).join(" ");
    if (!message) {
      console.error(`${c.red}✘ Usage: npx memoryz log "Message" [--level=info] [--source=agent]${c.reset}`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": token },
      body: JSON.stringify({
        message,
        level: flags.level || "info",
        source: flags.source || "cli",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Logged [${data.level.toUpperCase()}]:${c.reset} ${data.message}\n`);
    } else {
      console.error(`${c.red}✘ Failed to log: ${data.error}${c.reset}`);
    }
  }
}

async function runSnapshot() {
  if (!token) {
    console.error(`${c.red}✘ Error: No token found.${c.reset}`);
    process.exit(1);
  }
  const sub = positionals[1];
  if (sub === "save") {
    const name = flags.name || positionals[2];
    const content = flags.content || positionals.slice(3).join(" ");
    if (!name || !content) {
      console.error(`${c.red}✘ Usage: npx memoryz snapshot save <name> <content>${c.reset}`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/context/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": token },
      body: JSON.stringify({ name, content, description: flags.desc }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Context snapshot '${data.name}' saved successfully!${c.reset}\n`);
    } else {
      console.error(`${c.red}✘ Failed: ${data.error}${c.reset}`);
    }
  } else if (sub === "get" || sub === "load") {
    const name = flags.name || positionals[2];
    if (!name) {
      console.error(`${c.red}✘ Usage: npx memoryz snapshot get <name>${c.reset}`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/context/snapshots/${encodeURIComponent(name)}`, {
      headers: { "X-API-Key": token },
    });
    const data = await res.json();
    if (res.ok) {
      console.log(data.content);
    } else {
      console.error(`${c.red}✘ ${data.error || "Not found"}${c.reset}`);
    }
  } else {
    const res = await fetch(`${serverUrl}/api/context/snapshots`, {
      headers: { "X-API-Key": token },
    });
    const data = await res.json();
    console.log(`\n${c.cyan}📦 Context Snapshots (${data.count || 0}):${c.reset}`);
    (data.snapshots || []).forEach((s) => {
      console.log(`  • ${s.name} ${c.dim}(${new Date(s.updated_at * 1000).toLocaleDateString()})${c.reset}`);
    });
    console.log("");
  }
}

async function runRecall() {

  if (!token) {
    if (flags.json) {
      console.log(JSON.stringify({ error: "Missing token. Run 'memoryz init --token=...'" }));
    } else {
      console.error(`${c.red}✘ Error: No token found. Run 'npx memoryz init --token=...' first.${c.reset}`);
    }
    process.exit(1);
  }
  const query = positionals.slice(1).join(" ") || flags.query || "";
  const type = flags.type || "";
  const limit = flags.limit || 5;

  const url = new URL(`${serverUrl}/api/memories/recall`);
  if (query) url.searchParams.set("query", query);
  if (type) url.searchParams.set("type", type);
  url.searchParams.set("limit", String(limit));

  if (!flags.json) {
    console.log(`\n${c.cyan}⚡ Recalling memories for: "${query || "(all)"}"...${c.reset}\n`);
  }

  try {
    const res = await fetch(url, {
      headers: { "X-API-Key": token },
    });
    const data = await res.json();
    const memories = data.memories || [];

    if (flags.json) {
      console.log(JSON.stringify(memories, null, 2));
      return;
    }

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
    if (flags.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(`${c.red}Error recalling memories: ${err.message}${c.reset}`);
    }
  }
}

async function runStore() {
  if (!token) {
    if (flags.json) {
      console.log(JSON.stringify({ error: "Missing token. Run 'memoryz init --token=...'" }));
    } else {
      console.error(`${c.red}✘ Error: No token found. Run 'npx memoryz init --token=...' first.${c.reset}`);
    }
    process.exit(1);
  }

  let content = flags.content || positionals.slice(1).join(" ");
  if (!content) {
    content = await readStdin();
  }

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
    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    if (res.ok) {
      console.log(`\n${c.green}✔ Memory atom stored successfully! [${data.type}] (Hash: ${data.hash.substring(0, 10)}...)${c.reset}\n`);
    } else {
      console.error(`${c.red}✘ Failed to store memory: ${data.error || "Unknown error"}${c.reset}`);
    }
  } catch (err) {
    if (flags.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(`${c.red}✘ Network error: ${err.message}${c.reset}`);
    }
  }
}

async function runContext() {
  if (!token) {
    console.log("<!-- MemoryZ not configured. Run 'memoryz init' -->");
    return;
  }
  const query = positionals.slice(1).join(" ") || flags.query || "";
  const limit = flags.limit || 5;

  const url = new URL(`${serverUrl}/api/memories/recall`);
  if (query) url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));

  try {
    const res = await fetch(url, { headers: { "X-API-Key": token } });
    const data = await res.json();
    const memories = data.memories || [];

    if (memories.length === 0) {
      console.log("<!-- No relevant memories found in substrate -->");
      return;
    }

    let out = "<memoryz_context>\n";
    memories.forEach((m) => {
      out += `  <memory type="${m.type}" title="${m.title || ""}" recall_score="${m.recall_score || 0}">\n`;
      out += `    ${m.content.trim()}\n`;
      out += `  </memory>\n`;
    });
    out += "</memoryz_context>";
    console.log(out);
  } catch (err) {
    console.log(`<!-- MemoryZ context error: ${err.message} -->`);
  }
}

async function runSkill(quiet = false) {
  const home = os.homedir();
  const isGlobal = flags.global || false;
  const projectAgentsDir = path.join(process.cwd(), ".agents", "skills", "memoryz");
  const globalAgentsDir = path.join(home, ".agents", "skills", "memoryz");
  const targetDir = flags["export-dir"] || (isGlobal ? globalAgentsDir : projectAgentsDir);
  const skillFile = path.join(targetDir, "SKILL.md");

  const skillContent = `---
name: memoryz
description: Sovereign Agentic Memory Substrate. Use to automatically recall developer preferences, system environment rules, port allocations, and store new persistent instructions.
---

# MemoryZ — Sovereign Agentic Memory Substrate

MemoryZ gives you a persistent, living cross-session memory substrate.
Use it to recall developer preferences and store new knowledge.

## When to Recall Memory
- Before starting a task: check if the developer has specific rules, preferred tools, ports, or libraries.
- Execute command in terminal:
  \`memoryz recall "<task topic>" --json\`
  OR
  \`memoryz context "<task topic>"\`

## When to Store Memory
- When the developer gives instructions or preferences (e.g., "I prefer PM2", "Port 3333 is for test domain").
- Execute command:
  \`memoryz store --type=preference --content="<rule text>"\`
  Types:
  - \`env\`: Ports, infrastructure, domains, CLI tool choices.
  - \`preference\`: Coding habits, architectural patterns, styles.
  - \`skill\`: Multi-step procedure prompts or custom agent workflows.
  - \`note\`: Facts, URLs, references.

## Secret Vault
- For credentials and API keys (never store plaintext secrets in notes):
  \`memoryz vault store --key="<name>" --secret="<val>" --pass="<passphrase>"\`
  \`memoryz vault get --key="<name>" --pass="<passphrase>"\`
`;

  try {
    // 1. Write Project SKILL.md
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(skillFile, skillContent, "utf8");

    // 2. Also write Global Agent Skill in ~/.agents/skills/memoryz/SKILL.md
    try {
      if (!fs.existsSync(globalAgentsDir)) fs.mkdirSync(globalAgentsDir, { recursive: true });
      fs.writeFileSync(path.join(globalAgentsDir, "SKILL.md"), skillContent, "utf8");
    } catch (_e) {}

    // 3. Update or create AGENTS.md in current directory
    const agentsMd = path.join(process.cwd(), "AGENTS.md");
    const agentRuleSnippet = `\n## MemoryZ Agent Memory Substrate\nThis project connects to MemoryZ. Use \`memoryz recall "<query>" --json\` to retrieve preferences and \`memoryz store --type=... --content="..."\` to save rules.\n`;
    if (fs.existsSync(agentsMd)) {
      const existing = fs.readFileSync(agentsMd, "utf8");
      if (!existing.includes("MemoryZ Agent Memory Substrate")) {
        fs.appendFileSync(agentsMd, agentRuleSnippet, "utf8");
      }
    } else {
      fs.writeFileSync(agentsMd, `# Project Agent Rules\n${agentRuleSnippet}`, "utf8");
    }

    // 4. Update or create CLAUDE.md for Claude Code
    const claudeMd = path.join(process.cwd(), "CLAUDE.md");
    const claudeSnippet = `\n# Memory Substrate (MemoryZ)\n- Query past preferences: \`memoryz recall "<query>" --json\`\n- Inject task context: \`memoryz context "<query>"\`\n- Store persistent rules: \`memoryz store --type=preference --content="..."\`\n`;
    if (fs.existsSync(claudeMd)) {
      const existing = fs.readFileSync(claudeMd, "utf8");
      if (!existing.includes("Memory Substrate (MemoryZ)")) {
        fs.appendFileSync(claudeMd, claudeSnippet, "utf8");
      }
    } else {
      fs.writeFileSync(claudeMd, `# Claude Assistant Guidelines\n${claudeSnippet}`, "utf8");
    }

    // 5. Update or create .cursorrules for Cursor
    const cursorRules = path.join(process.cwd(), ".cursorrules");
    if (!fs.existsSync(cursorRules)) {
      fs.writeFileSync(cursorRules, `# Cursor AI Rules\nAlways check developer preferences: memoryz recall "<topic>" --json\n`, "utf8");
    }

    if (!quiet) {
      console.log(`\n${c.green}✔ Created Agent Skill at: ${skillFile}${c.reset}`);
      console.log(`${c.green}✔ Created Global Agent Skill at: ${path.join(globalAgentsDir, "SKILL.md")}${c.reset}`);
      console.log(`${c.green}✔ Injected MemoryZ rules into: ${agentsMd}${c.reset}`);
      console.log(`${c.green}✔ Injected MemoryZ rules into: ${claudeMd}${c.reset}\n`);
    }
  } catch (err) {
    if (!quiet) console.error(`${c.red}Failed to create skill: ${err.message}${c.reset}`);
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
    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    if (res.ok) {
      console.log(`\n${c.green}✔ Decrypted '${keyName}':${c.reset} ${data.secret_value}\n`);
    } else {
      console.error(`\n${c.red}✘ Failed: ${data.error || "Decryption failed"}${c.reset}\n`);
    }
  } else if (sub === "store") {
    const keyName = flags.key || positionals[2];
    let secret = flags.secret || positionals[3];
    if (!secret) secret = await readStdin();
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
    if (flags.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    if (res.ok) {
      console.log(`\n${c.green}✔ Secret '${keyName}' encrypted and stored in Zero-Knowledge vault!${c.reset}`);
      if (data.recoveryKey) {
        console.log(`\n${c.yellow}⚠️ ONE-TIME RECOVERY KEY (SAVE THIS!): ${data.recoveryKey}${c.reset}\n`);
      }
    } else {
      console.error(`\n${c.red}✘ Failed: ${data.error}${c.reset}\n`);
    }
  } else if (sub === "delete" || sub === "rm") {
    const keyName = flags.key || flags.name || positionals[2];
    if (!keyName) {
      console.error(`Usage: npx memoryz vault delete --key=<name>`);
      process.exit(1);
    }
    const res = await fetch(`${serverUrl}/api/vault/${encodeURIComponent(keyName)}`, {
      method: "DELETE",
      headers: { "X-API-Key": token },
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`\n${c.green}✔ Deleted '${keyName}' from vault.${c.reset}\n`);
    } else {
      console.error(`\n${c.red}✘ Failed: ${data.error || "Delete failed"}${c.reset}\n`);
    }
  } else {
    // List vault handles
    const res = await fetch(`${serverUrl}/api/vault`, {
      headers: { "X-API-Key": token },
    });
    const data = await res.json();
    const keys = data.keys || [];
    if (flags.json) {
      console.log(JSON.stringify(keys, null, 2));
      return;
    }
    console.log(`\n${c.cyan}🔐 Vault Secrets (${keys.length}):${c.reset}`);
    keys.forEach((k) => console.log(`  • ${k.key_name} ${c.dim}(${new Date(k.created_at * 1000).toLocaleDateString()})${c.reset}`));
    console.log("");
  }
}

async function runMcpBridge() {
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
${c.bold}${c.cyan}MemoryZ v2 CLI — Sovereign Agentic Memory & Task Substrate${c.reset}

${c.bold}Setup & Integration:${c.reset}
  ${c.green}npx memoryz init --token=<YOUR_TOKEN>${c.reset}
      Auto-detect and register MemoryZ in Cursor, Claude Desktop, Claude Code, Windsurf.

${c.bold}Hierarchical Task & Multi-Agent TODOs:${c.reset}
  ${c.green}npx memoryz task list [--tree] [--status=active|todo|done]${c.reset}
      Display tasks as an ultra-compact, token-efficient hierarchy tree.
  ${c.green}npx memoryz task add "<Title>" [--parent=<id>] [--status=todo] [--priority=medium]${c.reset}
      Create a root task or nested child subtask.
  ${c.green}npx memoryz task done <task_id>${c.reset}
      Mark task completed.
  ${c.green}npx memoryz task update <task_id> [--status=...] [--title=...]${c.reset}
      Update task status, priority, or assignee.
  ${c.green}npx memoryz task rm <task_id>${c.reset}
      Delete task and its subtasks.

${c.bold}Living Memory & Vector Recall:${c.reset}
  ${c.green}npx memoryz recall "<query>" [--compact] [--limit=5]${c.reset}
      Semantic vector recall with time-decay scoring.
  ${c.green}npx memoryz store --type=env|skill|preference|note --content="..." [--title="..."]${c.reset}
      Store a memory atom with automatic 768-dim Gemini vector embedding.

${c.bold}Ephemeral Logs & Scratchpads:${c.reset}
  ${c.green}npx memoryz log "<Message>" [--level=info] [--source=agent]${c.reset}
      Fast lightweight logging without heavy embeddings.
  ${c.green}npx memoryz logs [--limit=25]${c.reset}
      View recent ephemeral agent logs.

${c.bold}Context Packs & Working Snapshots:${c.reset}
  ${c.green}npx memoryz context "<query>" [--tokens=1200] [--compact]${c.reset}
      Dense, token-budgeted prompt context block (active tasks + memories).
  ${c.green}npx memoryz snapshot save <name> "<content>"${c.reset}
      Save complete context checkpoints to restore later.
  ${c.green}npx memoryz snapshot get <name>${c.reset}
      Restore saved context checkpoint.

${c.bold}Zero-Knowledge Secret Vault:${c.reset}
  ${c.green}npx memoryz vault store --key="..." --secret="..." --pass="..."${c.reset}
  ${c.green}npx memoryz vault get --key="..." --pass="..."${c.reset}
  ${c.green}npx memoryz vault list${c.reset}

${c.bold}MCP Transport:${c.reset}
  ${c.green}npx memoryz mcp${c.reset}
      Run stdio bridge for local agent integration.

${c.bold}Options:${c.reset}
  --token=<key>    MemoryZ API Key or JWT token
  --url=<url>      MemoryZ Server URL (default: ${DEFAULT_SERVER_URL})
  --json           Output raw JSON for scripts and AI tools
  --compact        Ultra-compact output format to save LLM tokens
`);
}


main().catch((err) => {
  console.error(`${c.red}Fatal: ${err.message}${c.reset}`);
  process.exit(1);
});
