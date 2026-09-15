import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const DEFAULT_SERVER_URL = "https://memoryz.wino.deno.net";
export const CONFIG_DIR = path.join(os.homedir(), ".memoryz");
export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function loadConfig() {
  let saved = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch (_e) {}

  const token =
    process.env.MEMORYZ_TOKEN ||
    process.env.MEMORYZ_API_KEY ||
    saved.token ||
    "";
  const url = (
    process.env.MEMORYZ_URL ||
    saved.url ||
    DEFAULT_SERVER_URL
  ).replace(/\/$/, "");

  return { token, url };
}

// --- Memory Operations ---
export async function recall(query = "", options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing. Configure via ~/.memoryz/config.json or MEMORYZ_TOKEN env var.");

  const reqUrl = new URL(`${url}/api/memories/recall`);
  if (query) reqUrl.searchParams.set("query", query);
  if (options.type) reqUrl.searchParams.set("type", options.type);
  if (options.limit) reqUrl.searchParams.set("limit", String(options.limit));
  if (options.format) reqUrl.searchParams.set("format", options.format);

  const res = await fetch(reqUrl, {
    headers: {
      "X-API-Key": token,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MemoryZ recall failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.memories || data.items || [];
}

export async function store({ type = "note", content, title, metadata }, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");
  if (!content) throw new Error("Content is required to store memory.");

  const res = await fetch(`${url}/api/memories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": token,
    },
    body: JSON.stringify({ type, content, title, metadata }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`MemoryZ store failed: ${data.error || "Unknown error"}`);
  }
  return data;
}

// --- Hierarchical Tasks ---
export async function taskCreate({ title, parentId, description, status = "todo", priority = "medium", assignee, metadata }, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");
  if (!title) throw new Error("Task title is required.");

  const res = await fetch(`${url}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": token },
    body: JSON.stringify({
      title,
      parent_id: parentId,
      description,
      status,
      priority,
      assignee,
      metadata,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create task");
  return data;
}

export async function taskList(filter = {}, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");

  const reqUrl = new URL(`${url}/api/tasks`);
  if (filter.status) reqUrl.searchParams.set("status", filter.status);
  if (filter.parentId) reqUrl.searchParams.set("parent_id", filter.parentId);
  if (filter.assignee) reqUrl.searchParams.set("assignee", filter.assignee);
  if (filter.format) reqUrl.searchParams.set("format", filter.format);

  const res = await fetch(reqUrl, { headers: { "X-API-Key": token } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to list tasks");
  return data.tasks || data.tree || [];
}

export async function taskUpdate(id, updates = {}, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");

  const res = await fetch(`${url}/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-API-Key": token },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update task");
  return data;
}

export async function taskDone(id, options = {}) {
  return taskUpdate(id, { status: "done" }, options);
}

export async function taskDelete(id, cascade = true, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");

  const res = await fetch(`${url}/api/tasks/${id}?cascade=${cascade}`, {
    method: "DELETE",
    headers: { "X-API-Key": token },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete task");
  return data.success;
}

// --- Ephemeral Logs ---
export async function logStore({ message, level = "info", source = "agent", metadata }, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");

  const res = await fetch(`${url}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": token },
    body: JSON.stringify({ message, level, source, metadata }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to store log");
  return data;
}

export async function logList(filter = {}, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");

  const reqUrl = new URL(`${url}/api/logs`);
  if (filter.level) reqUrl.searchParams.set("level", filter.level);
  if (filter.source) reqUrl.searchParams.set("source", filter.source);
  if (filter.limit) reqUrl.searchParams.set("limit", String(filter.limit));

  const res = await fetch(reqUrl, { headers: { "X-API-Key": token } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to list logs");
  return data.logs || [];
}

// --- Context Packs & Snapshots ---
export async function getContextPack(query = "", options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");

  const reqUrl = new URL(`${url}/api/context/pack`);
  if (query) reqUrl.searchParams.set("query", query);
  if (options.tokens) reqUrl.searchParams.set("tokens", String(options.tokens));
  if (options.format) reqUrl.searchParams.set("format", options.format);

  const res = await fetch(reqUrl, { headers: { "X-API-Key": token } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate context pack");
  return data.content || "";
}

export async function getContext(query = "", options = {}) {
  return getContextPack(query, options);
}

// --- Zero-Knowledge Vault ---
export async function vaultStore({ keyName, secretValue, passphrase }, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");

  const res = await fetch(`${url}/api/vault`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": token,
    },
    body: JSON.stringify({
      key_name: keyName,
      secret_value: secretValue,
      passphrase,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Vault store failed: ${data.error}`);
  }
  return data;
}

export async function vaultGet({ keyName, passphrase }, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");

  const res = await fetch(`${url}/api/vault/retrieve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": token,
    },
    body: JSON.stringify({
      key_name: keyName,
      passphrase,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Vault get failed: ${data.error}`);
  }
  return data.secret_value;
}

export default {
  loadConfig,
  recall,
  store,
  taskCreate,
  taskList,
  taskUpdate,
  taskDone,
  taskDelete,
  logStore,
  logList,
  getContextPack,
  getContext,
  vaultStore,
  vaultGet,
};
