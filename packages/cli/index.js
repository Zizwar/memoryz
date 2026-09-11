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

export async function recall(query = "", options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing. Configure via ~/.memoryz/config.json or MEMORYZ_TOKEN env var.");

  const reqUrl = new URL(`${url}/api/memories/recall`);
  if (query) reqUrl.searchParams.set("query", query);
  if (options.type) reqUrl.searchParams.set("type", options.type);
  if (options.limit) reqUrl.searchParams.set("limit", String(options.limit));

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
  return data.memories || [];
}

export async function store({ type = "note", content, title }, options = {}) {
  const { token, url } = { ...loadConfig(), ...options };
  if (!token) throw new Error("MemoryZ token is missing.");
  if (!content) throw new Error("Content is required to store memory.");

  const res = await fetch(`${url}/api/memories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": token,
    },
    body: JSON.stringify({ type, content, title }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`MemoryZ store failed: ${data.error || "Unknown error"}`);
  }
  return data;
}

export async function getContext(query = "", options = {}) {
  const memories = await recall(query, options);
  if (!memories || memories.length === 0) return "";

  let xml = "<memoryz_context>\n";
  for (const m of memories) {
    xml += `  <memory type="${m.type}" title="${m.title || ""}" score="${m.recall_score || 0}">\n`;
    xml += `    ${m.content.trim()}\n`;
    xml += `  </memory>\n`;
  }
  xml += "</memoryz_context>";
  return xml;
}

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
  getContext,
  vaultStore,
  vaultGet,
};
