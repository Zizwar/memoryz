import { getDb } from "../db/client.ts";
import { MemoryNode, MemoryService } from "./memory.ts";
import { TaskService } from "./task.ts";
import { LogService } from "./log.ts";

export interface ContextSnapshot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface BuildContextPackOptions {
  userId: string;
  query?: string;
  namespace?: string;
  threshold?: number;
  tokenBudget?: number; // default ~1200 tokens
  includeTasks?: boolean; // default true
  includeLogs?: boolean; // default false
  taskStatus?: string; // default "active"
  format?: "xml" | "markdown" | "compact"; // default "xml"
}

export interface ContextPackResult {
  content: string;
  estimatedTokens: number;
  memoryCount: number;
  taskCount: number;
  logCount: number;
}

export class ContextService {
  /**
   * Rough token estimation: ~4 chars per token for English/code, ~2 chars per token for Arabic
   */
  static estimateTokens(text: string): number {
    let arabicCount = 0;
    let otherCount = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x0600 && code <= 0x06ff) {
        arabicCount++;
      } else {
        otherCount++;
      }
    }
    return Math.ceil(arabicCount / 2 + otherCount / 4);
  }

  /**
   * Save a persistent context snapshot
   */
  static async saveSnapshot(
    userId: string,
    name: string,
    content: string,
    description?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<ContextSnapshot> {
    const db = getDb();
    const id = `ctx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Math.floor(Date.now() / 1000);
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Snapshot name cannot be empty");

    await db.execute({
      sql: `
        INSERT INTO context_snapshots (id, user_id, name, description, content, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, name)
        DO UPDATE SET content = excluded.content, description = excluded.description,
                      metadata = excluded.metadata, updated_at = excluded.updated_at;
      `,
      args: [id, userId, trimmedName, description || null, content, JSON.stringify(metadata), now, now],
    });

    return {
      id,
      user_id: userId,
      name: trimmedName,
      description: description || null,
      content,
      metadata,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Retrieve a context snapshot by name
   */
  static async getSnapshot(userId: string, name: string): Promise<ContextSnapshot | null> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM context_snapshots WHERE user_id = ? AND name = ? LIMIT 1;",
      args: [userId, name.trim()],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id as string,
      user_id: r.user_id as string,
      name: r.name as string,
      description: (r.description as string) || null,
      content: r.content as string,
      metadata: JSON.parse((r.metadata as string) || "{}"),
      created_at: Number(r.created_at),
      updated_at: Number(r.updated_at),
    };
  }

  /**
   * List all saved context snapshots
   */
  static async listSnapshots(userId: string): Promise<ContextSnapshot[]> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM context_snapshots WHERE user_id = ? ORDER BY updated_at DESC;",
      args: [userId],
    });
    return res.rows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      name: r.name as string,
      description: (r.description as string) || null,
      content: r.content as string,
      metadata: JSON.parse((r.metadata as string) || "{}"),
      created_at: Number(r.created_at),
      updated_at: Number(r.updated_at),
    }));
  }

  /**
   * Delete a context snapshot
   */
  static async deleteSnapshot(userId: string, name: string): Promise<boolean> {
    const db = getDb();
    const res = await db.execute({
      sql: "DELETE FROM context_snapshots WHERE user_id = ? AND name = ?;",
      args: [userId, name.trim()],
    });
    return res.rowsAffected > 0;
  }

  /**
   * Build an ultra-compact, token-budgeted context pack without breaking XML/Markdown tags
   */
  static async buildContextPack(options: BuildContextPackOptions): Promise<ContextPackResult> {
    const tokenBudget = options.tokenBudget || 1200;
    const format = options.format || "xml";
    const includeTasks = options.includeTasks !== false;
    const includeLogs = options.includeLogs === true;

    const memories = await MemoryService.recall({
      userId: options.userId,
      query: options.query,
      namespace: options.namespace,
      threshold: options.threshold,
      limit: 10,
    });

    let taskTree: any[] = [];
    let tasksCount = 0;
    if (includeTasks) {
      taskTree = await TaskService.getTree(options.userId, {
        status: options.taskStatus || "active",
        namespace: options.namespace,
      });
      const flatTasks = await TaskService.list(options.userId, {
        status: options.taskStatus || "active",
        namespace: options.namespace,
      });
      tasksCount = flatTasks.length;
    }

    let logs: any[] = [];
    if (includeLogs) {
      logs = await LogService.list(options.userId, { limit: 5 });
    }

    // Fit memories greedily into remaining token budget so XML/Markdown structure never breaks
    const fitMemories = (headerTokens: number, footerTokens: number): MemoryNode[] => {
      const kept: MemoryNode[] = [];
      let used = headerTokens + footerTokens;
      for (const m of memories) {
        const itemCost = this.estimateTokens(m.content) + 18;
        if (used + itemCost > tokenBudget && kept.length > 0) break;
        used += itemCost;
        kept.push(m);
      }
      return kept;
    };

    let out = "";
    let keptMemories: MemoryNode[] = [];

    if (format === "xml") {
      const secBlock =
        "  <security_policy>\n" +
        "    CRITICAL ZERO-LEAK RULE: Plaintext credentials, passwords, tokens, and API keys are strictly prohibited in memories/notes/skills. Secrets must always be encrypted in the vault using vault_store and referenced only by key name or environment variable.\n" +
        "  </security_policy>\n";
      const taskBlock =
        taskTree.length > 0
          ? "  <active_tasks>\n" + TaskService.formatTreeAscii(taskTree, 2) + "  </active_tasks>\n"
          : "";
      let logBlock = "";
      if (logs.length > 0) {
        logBlock += "  <recent_logs>\n";
        for (const l of logs) {
          logBlock += `    [${l.level}] ${l.source}: ${l.message}\n`;
        }
        logBlock += "  </recent_logs>\n";
      }

      const baseTokens = this.estimateTokens(`<memoryz_context>\n${secBlock}${taskBlock}${logBlock}</memoryz_context>`);
      keptMemories = fitMemories(baseTokens, 20);

      out += "<memoryz_context>\n";
      out += secBlock;
      out += taskBlock;
      if (keptMemories.length > 0) {
        out += "  <recalled_memories>\n";
        for (const m of keptMemories) {
          const titleAttr = m.title ? ` title="${m.title.replace(/"/g, "'")}"` : "";
          out += `    <item type="${m.type}"${titleAttr} score="${m.recall_score}">\n`;
          out += `      ${m.content.trim()}\n`;
          out += `    </item>\n`;
        }
        out += "  </recalled_memories>\n";
      }
      out += logBlock;
      out += "</memoryz_context>";
    } else if (format === "markdown") {
      const header =
        "# MemoryZ Context Pack\n\n" +
        "> **CRITICAL SECURITY RULE**: Plaintext passwords, tokens, and API keys must NEVER be stored in memories/skills. Always use `vault_store` for credentials and reference them by key name.\n\n";
      const taskBlock =
        taskTree.length > 0 ? "## Active Task Tree\n```text\n" + TaskService.formatTreeAscii(taskTree, 0) + "```\n\n" : "";
      let logBlock = "";
      if (logs.length > 0) {
        logBlock += "## Recent Logs\n";
        for (const l of logs) {
          logBlock += `- [${l.level.toUpperCase()}] \`${l.source}\`: ${l.message}\n`;
        }
        logBlock += "\n";
      }

      keptMemories = fitMemories(this.estimateTokens(header + taskBlock + logBlock), 10);
      out += header + taskBlock;
      if (keptMemories.length > 0) {
        out += "## Recalled Knowledge & Preferences\n";
        for (const m of keptMemories) {
          out += `- **[${m.type.toUpperCase()}] ${m.title || "Rule"}**: ${m.content.trim()}\n`;
        }
        out += "\n";
      }
      out += logBlock;
    } else {
      const taskBlock = taskTree.length > 0 ? "[TASKS]\n" + TaskService.formatTreeAscii(taskTree, 0) : "";
      const logBlock = logs.length > 0 ? "[LOGS]\n" + LogService.formatCompact(logs) + "\n" : "";
      keptMemories = fitMemories(this.estimateTokens("=== MEMORYZ CONTEXT ===\n" + taskBlock + logBlock), 10);

      out += "=== MEMORYZ CONTEXT ===\n" + taskBlock;
      if (keptMemories.length > 0) {
        out += "[MEMORIES]\n";
        for (const m of keptMemories) {
          out += `• [${m.type}] ${m.title ? m.title + ": " : ""}${m.content.trim()}\n`;
        }
      }
      out += logBlock;
    }

    return {
      content: out,
      estimatedTokens: this.estimateTokens(out),
      memoryCount: keptMemories.length,
      taskCount: tasksCount,
      logCount: logs.length,
    };
  }
}
