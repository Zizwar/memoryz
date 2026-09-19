import { MemoryService, MemoryType, RelationType } from "../services/memory.ts";
import { VaultService } from "../services/vault.ts";
import { TaskService, TaskPriority } from "../services/task.ts";
import { LogService, LogLevel } from "../services/log.ts";
import { ContextService } from "../services/context.ts";

export const MCP_TOOLS = [
  // 1. Core Memory Operations
  {
    name: "store_memory",
    description: "Store a new memory atom (note, skill, preference, or env state) with automatic 768-dim vector embedding.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["note", "skill", "preference", "env"],
          description: "Classification of memory: note, skill, preference, or env",
        },
        content: {
          type: "string",
          description: "The knowledge, rule, preference, or skill prompt to remember",
        },
        title: {
          type: "string",
          description: "Optional concise title or identifier for this memory",
        },
        metadata: {
          type: "object",
          description: "Optional key-value metadata (e.g. tools, ports, tags, URLs)",
        },
        namespace: {
          type: "string",
          description: "Optional project/namespace for isolation (default: 'default')",
        },
        agent_id: {
          type: "string",
          description: "Optional identifier of the agent writing this memory (for provenance)",
        },
        source: {
          type: "string",
          description: "Optional origin of this memory (e.g. 'human', 'claude', 'cursor-agent')",
        },
      },
      required: ["type", "content"],
    },
  },
  {
    name: "get_memory",
    description: "Fetch one or more memories by their exact hash, optionally including their linked knowledge-graph neighbors. Use this to resolve a hash another agent referenced in a note or task.",
    inputSchema: {
      type: "object",
      properties: {
        hash: { type: "string", description: "Exact hash of the memory to fetch" },
        hashes: { type: "array", items: { type: "string" }, description: "Multiple exact hashes to fetch in one call" },
        include_links: { type: "boolean", description: "Include linked graph neighbors (default: false)" },
      },
    },
  },
  {
    name: "memory_update",
    description: "Update the content, title, or metadata of an existing memory by hash. Re-embeds the content automatically.",
    inputSchema: {
      type: "object",
      properties: {
        hash: { type: "string", description: "Exact hash of the memory to update" },
        content: { type: "string", description: "New content to replace the memory with" },
        title: { type: "string", description: "Optional updated title" },
        metadata: { type: "object", description: "Optional updated metadata (replaces existing)" },
      },
      required: ["hash", "content"],
    },
  },
  {
    name: "memory_delete",
    description: "Soft-delete a memory by hash. The memory is excluded from future recall but not physically erased.",
    inputSchema: {
      type: "object",
      properties: {
        hash: { type: "string", description: "Exact hash of the memory to delete" },
      },
      required: ["hash"],
    },
  },
  {
    name: "recall_memory",
    description: "Retrieve relevant memories using Gemini vector semantic search, type filters, and decay-weighted scoring. Automatically reinforces recalled items. Supports token-saving compact mode.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural language query to semantically match against memory space",
        },
        type: {
          type: "string",
          enum: ["note", "skill", "preference", "env"],
          description: "Optional filter by memory type",
        },
        limit: {
          type: "number",
          description: "Maximum number of memories to return (default: 5)",
        },
        format: {
          type: "string",
          enum: ["compact", "summary", "full"],
          description: "Output format: 'compact' (one-liners, saves tokens), 'summary' (bullet points), or 'full' (complete JSON)",
        },
        namespace: {
          type: "string",
          description: "Optional project/namespace filter (default: 'default')",
        },
      },
    },
  },
  {
    name: "link_memory",
    description: "Create a typed graph relationship between two memories (e.g. depends_on, context_for, related, supersedes).",
    inputSchema: {
      type: "object",
      properties: {
        source_hash: { type: "string", description: "Hash of the source memory" },
        target_hash: { type: "string", description: "Hash of the target memory" },
        relation_type: {
          type: "string",
          enum: ["related", "depends_on", "supersedes", "context_for"],
          description: "Relationship type",
        },
      },
      required: ["source_hash", "target_hash"],
    },
  },

  // 2. Hierarchical Tasks & Multi-Agent TODOs
  {
    name: "task_create",
    description: "Create a hierarchical task or subtask. Allows multi-agent collaboration with parent-child nesting, flexible open statuses, priorities, and agent assignments.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title or short description of the task" },
        parent_id: { type: "string", description: "Optional parent task ID to create this as a subtask/child" },
        description: { type: "string", description: "Optional detailed instructions, criteria, or context" },
        status: { type: "string", description: "Status: 'todo', 'in_progress', 'done', 'blocked', or custom state (default: 'todo')" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Task priority (default: 'medium')" },
        assignee: { type: "string", description: "Agent or user assigned to this task (e.g. 'claude', 'cursor', 'architect')" },
        metadata: { type: "object", description: "Optional key-value metadata or custom tags" },
        namespace: { type: "string", description: "Optional project/namespace for isolation (default: 'default')" },
      },
      required: ["title"],
    },
  },
  {
    name: "task_update",
    description: "Update an existing task status (e.g. mark done, in_progress), title, assignee, or subtask nesting.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the task to update" },
        status: { type: "string", description: "New status (e.g. 'done', 'in_progress', 'todo', 'blocked')" },
        title: { type: "string", description: "Updated task title" },
        description: { type: "string", description: "Updated task description" },
        priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Updated priority" },
        assignee: { type: "string", description: "Updated assignee" },
        parent_id: { type: "string", description: "New parent ID (or null to make root)" },
      },
      required: ["id"],
    },
  },
  {
    name: "task_list",
    description: "List tasks. Default 'tree' format produces an ultra-compact, token-efficient ASCII tree suitable for agent prompts.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: 'active', 'todo', 'in_progress', 'done', etc." },
        parent_id: { type: "string", description: "Filter by parent task ID (use 'root' for top-level tasks only)" },
        assignee: { type: "string", description: "Filter by assigned agent or user" },
        format: {
          type: "string",
          enum: ["tree", "compact", "json"],
          description: "Format: 'tree' (token-efficient ASCII hierarchy), 'compact' (one-liners), or 'json' (raw objects)",
        },
        namespace: { type: "string", description: "Optional project/namespace filter (default: 'default')" },
      },
    },
  },
  {
    name: "task_claim",
    description: "Atomically claim a task for an agent, preventing two agents from working the same task simultaneously. Fails if another agent already holds the claim.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the task to claim" },
        agent_id: { type: "string", description: "Identifier of the claiming agent (e.g. 'claude', 'cursor', 'architect')" },
        release: { type: "boolean", description: "Set true to release this agent's own claim instead of claiming" },
      },
      required: ["id", "agent_id"],
    },
  },
  {
    name: "task_delete",
    description: "Delete a task. By default, recursively deletes its child subtasks.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the task to delete" },
        cascade: { type: "boolean", description: "Whether to also delete child subtasks (default: true)" },
      },
      required: ["id"],
    },
  },

  // 3. Ephemeral Logs & Scratchpad
  {
    name: "log_store",
    description: "Store an ephemeral log message or scratchpad entry. High-speed, low-overhead, and skips heavy vector embeddings.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Log message or trace content" },
        level: { type: "string", enum: ["info", "warn", "error", "debug", "trace"], description: "Log severity" },
        source: { type: "string", description: "Originating agent or tool (e.g. 'claude', 'cursor', 'build')" },
        metadata: { type: "object", description: "Optional metadata" },
      },
      required: ["message"],
    },
  },
  {
    name: "log_list",
    description: "Retrieve recent ephemeral logs or scratchpad traces.",
    inputSchema: {
      type: "object",
      properties: {
        level: { type: "string", enum: ["info", "warn", "error", "debug", "trace"] },
        source: { type: "string", description: "Filter by source" },
        limit: { type: "number", description: "Max logs to return (default: 20)" },
        format: { type: "string", enum: ["compact", "json"], description: "Format: 'compact' (single lines) or 'json'" },
      },
    },
  },

  // 4. Token-Budgeted Context Pack & Snapshots
  {
    name: "context_pack",
    description: "Generate a token-budgeted, dense context bundle merging relevant memories, active hierarchical tasks, and environment rules directly for LLM prompts.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Current focus topic or task goal" },
        token_budget: { type: "number", description: "Maximum estimated tokens (default: 1200)" },
        include_tasks: { type: "boolean", description: "Include active task tree (default: true)" },
        include_logs: { type: "boolean", description: "Include recent logs (default: false)" },
        format: { type: "string", enum: ["xml", "markdown", "compact"], description: "Context packaging format" },
      },
    },
  },
  {
    name: "context_snapshot_save",
    description: "Save a full context snapshot (e.g. current working state, session checkpoint) that can be restored later.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Unique snapshot name or topic handle" },
        content: { type: "string", description: "Context text or markdown to preserve" },
        description: { type: "string", description: "Optional description" },
      },
      required: ["name", "content"],
    },
  },
  {
    name: "context_snapshot_load",
    description: "Load a previously saved context snapshot by name.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the snapshot to restore" },
      },
      required: ["name"],
    },
  },

  // 5. Zero-Knowledge Secret Vault
  {
    name: "vault_store",
    description: "Securely encrypt and store a confidential secret or API key in the Zero-Knowledge vault using AES-256-GCM. Plaintext is never stored or embedded.",
    inputSchema: {
      type: "object",
      properties: {
        key_name: { type: "string", description: "Key identifier (e.g. 'key_gemini', 'aws_access_key')" },
        secret_value: { type: "string", description: "Confidential string/secret to encrypt" },
        passphrase: { type: "string", description: "Passphrase used to derive AES-256-GCM encryption key" },
      },
      required: ["key_name", "secret_value", "passphrase"],
    },
  },
  {
    name: "vault_retrieve",
    description: "Decrypt and retrieve a confidential secret in transient RAM using the client passphrase. Plaintext is never saved to disk or logs.",
    inputSchema: {
      type: "object",
      properties: {
        key_name: { type: "string", description: "Key identifier to retrieve" },
        passphrase: { type: "string", description: "Passphrase used for decryption" },
      },
      required: ["key_name", "passphrase"],
    },
  },
  {
    name: "vault_list",
    description: "List all encrypted secret key handles in the user's vault without revealing contents or passwords.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export class McpServer {
  /**
   * Handle incoming MCP JSON-RPC requests (stateless & compliant with Claude/ChatGPT/Windsurf)
   */
  static async handleRpc(userId: string, request: any): Promise<any> {
    const { id, method, params } = request || {};

    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: "MemoryZ",
            version: "3.0.0",
          },
          instructions:
            "MemoryZ v3 is a sovereign agentic memory & hierarchical multi-agent task substrate. " +
            "Use 'task_create', 'task_list', 'task_update', and 'task_claim' to manage hierarchical multi-agent tasks without duplicate work. " +
            "Use 'recall_memory' (with format: 'compact'), 'get_memory' (exact hash lookup), or 'context_pack' for token-efficient retrieval. " +
            "Use 'store_memory' to remember long-term rules (optionally with 'namespace' for project isolation and 'agent_id'/'source' for provenance), " +
            "'memory_update'/'memory_delete' to correct or remove memories, and 'log_store' for ephemeral traces. " +
            "Use 'vault_store' and 'vault_retrieve' for encrypted credentials.",
        },
      };
    }

    if (method === "ping") {
      return { jsonrpc: "2.0", id, result: {} };
    }

    // JSON-RPC Notification -> MUST return null
    if (method === "notifications/initialized" || typeof id === "undefined") {
      return null;
    }

    if (method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_TOOLS,
        },
      };
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params || {};
      try {
        const result = await this.executeTool(userId, name, args || {});
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: (err as Error).message,
          },
        };
      }
    }

    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method '${method}' not found`,
      },
    };
  }

  private static async executeTool(userId: string, name: string, args: any): Promise<any> {
    switch (name) {
      // --- Core Memory ---
      case "store_memory": {
        const node = await MemoryService.store({
          userId,
          type: args.type as MemoryType,
          content: args.content,
          title: args.title,
          metadata: args.metadata,
          namespace: args.namespace,
          agentId: args.agent_id,
          source: args.source,
        });
        return {
          status: "stored",
          hash: node.hash,
          type: node.type,
          title: node.title,
          namespace: node.namespace,
          message: `Memory stored successfully with 768-dim embedding.`,
        };
      }

      case "get_memory": {
        const hashes: string[] = args.hashes && Array.isArray(args.hashes) ? args.hashes : args.hash ? [args.hash] : [];
        if (hashes.length === 0) throw new Error("Provide 'hash' or 'hashes'");
        const memories = await MemoryService.getByHash(userId, hashes, args.include_links === true);
        return {
          count: memories.length,
          memories: memories.map((m) => ({
            hash: m.hash,
            type: m.type,
            title: m.title,
            content: m.content,
            metadata: m.metadata,
            namespace: m.namespace,
            agent_id: m.agent_id,
            source: m.source,
            links: m.links,
          })),
        };
      }

      case "memory_update": {
        const ok = await MemoryService.updateMemory(userId, args.hash, args.content, args.title, args.metadata);
        if (!ok) throw new Error(`Memory '${args.hash}' not found`);
        return { status: "updated", hash: args.hash };
      }

      case "memory_delete": {
        const ok = await MemoryService.deleteMemory(userId, args.hash);
        return { status: ok ? "deleted" : "not_found", hash: args.hash };
      }

      case "recall_memory": {
        const format = args.format || "compact";
        const memories = await MemoryService.recall({
          userId,
          query: args.query,
          type: args.type as MemoryType,
          limit: args.limit ? parseInt(args.limit, 10) : 5,
          namespace: args.namespace,
        });

        if (format === "compact") {
          return {
            count: memories.length,
            formatted: MemoryService.formatCompact(memories),
            items: memories.map((m) => ({
              hash: m.hash.substring(0, 10),
              type: m.type,
              title: m.title,
              snippet: m.content.length > 120 ? m.content.substring(0, 120) + "..." : m.content,
              score: m.recall_score,
            })),
          };
        }

        if (format === "summary") {
          return {
            count: memories.length,
            summary: MemoryService.formatSummary(memories),
          };
        }

        return {
          count: memories.length,
          memories: memories.map((m) => ({
            hash: m.hash,
            type: m.type,
            title: m.title,
            content: m.content,
            metadata: m.metadata,
            recall_score: m.recall_score,
            similarity: m.score,
            links: m.links,
          })),
        };
      }

      case "link_memory": {
        await MemoryService.linkMemories(
          userId,
          args.source_hash,
          args.target_hash,
          (args.relation_type as RelationType) || "related"
        );
        return { status: "linked", message: "Memories linked in knowledge graph successfully." };
      }

      // --- Hierarchical Tasks ---
      case "task_create": {
        const task = await TaskService.create({
          userId,
          title: args.title,
          parentId: args.parent_id,
          description: args.description,
          status: args.status,
          priority: args.priority as TaskPriority,
          assignee: args.assignee,
          metadata: args.metadata,
          namespace: args.namespace,
        });
        return {
          status: "created",
          task_id: task.id,
          title: task.title,
          task_status: task.status,
          parent_id: task.parent_id,
          assignee: task.assignee,
          namespace: task.namespace,
        };
      }

      case "task_update": {
        const updated = await TaskService.update(userId, args.id, {
          status: args.status,
          title: args.title,
          description: args.description,
          priority: args.priority as TaskPriority,
          assignee: args.assignee,
          parentId: args.parent_id,
        });
        return {
          status: "updated",
          task: updated,
        };
      }

      case "task_list": {
        const format = args.format || "tree";
        if (format === "tree") {
          const tree = await TaskService.getTree(userId, { status: args.status, namespace: args.namespace });
          const ascii = TaskService.formatTreeAscii(tree);
          return {
            tree: ascii || "(No tasks found)",
            total_roots: tree.length,
          };
        }

        const tasks = await TaskService.list(userId, {
          status: args.status,
          parentId: args.parent_id,
          assignee: args.assignee,
          namespace: args.namespace,
        });

        if (format === "compact") {
          return {
            count: tasks.length,
            formatted: TaskService.formatCompactList(tasks),
          };
        }

        return { count: tasks.length, tasks };
      }

      case "task_claim": {
        if (args.release === true) {
          const released = await TaskService.release(userId, args.id, args.agent_id);
          return { status: released ? "released" : "not_claimed_by_you", task_id: args.id };
        }
        const result = await TaskService.claim(userId, args.id, args.agent_id);
        if (!result.success) {
          return {
            status: "claim_failed",
            reason: result.reason,
            task_id: args.id,
            locked_by: result.task?.locked_by ?? null,
          };
        }
        return {
          status: "claimed",
          task_id: args.id,
          agent_id: args.agent_id,
          task: result.task,
        };
      }

      case "task_delete": {
        const cascade = args.cascade !== false;
        const deleted = await TaskService.delete(userId, args.id, cascade);
        return { status: deleted ? "deleted" : "not_found", task_id: args.id };
      }

      // --- Ephemeral Logs ---
      case "log_store": {
        const log = await LogService.append({
          userId,
          message: args.message,
          level: args.level as LogLevel,
          source: args.source,
          metadata: args.metadata,
        });
        return { status: "logged", log_id: log.id };
      }

      case "log_list": {
        const logs = await LogService.list(userId, {
          level: args.level as LogLevel,
          source: args.source,
          limit: args.limit ? parseInt(args.limit, 10) : 20,
        });
        if (args.format === "json") {
          return { count: logs.length, logs };
        }
        return {
          count: logs.length,
          formatted: LogService.formatCompact(logs) || "(No logs)",
        };
      }

      // --- Context Pack & Snapshots ---
      case "context_pack": {
        const pack = await ContextService.buildContextPack({
          userId,
          query: args.query,
          tokenBudget: args.token_budget ? parseInt(args.token_budget, 10) : 1200,
          includeTasks: args.include_tasks !== false,
          includeLogs: args.include_logs === true,
          format: args.format || "xml",
        });
        return pack;
      }

      case "context_snapshot_save": {
        const snap = await ContextService.saveSnapshot(
          userId,
          args.name,
          args.content,
          args.description
        );
        return { status: "saved", name: snap.name, id: snap.id };
      }

      case "context_snapshot_load": {
        const snap = await ContextService.getSnapshot(userId, args.name);
        if (!snap) throw new Error(`Context snapshot '${args.name}' not found`);
        return { name: snap.name, content: snap.content, updated_at: snap.updated_at };
      }

      // --- Zero-Knowledge Vault ---
      case "vault_store": {
        const res = await VaultService.storeSecret(
          userId,
          args.key_name,
          args.secret_value,
          args.passphrase
        );
        const out: Record<string, any> = {
          status: "encrypted_and_stored",
          key_name: res.key_name,
          hash: res.hash,
          message: "Secret encrypted via AES-256-GCM. Plaintext discarded from RAM.",
        };
        if (res.recoveryKey) {
          out.warning = "FIRST_TIME_VAULT_NOTICE: Store this recovery key safely. It is shown only once!";
          out.recovery_key = res.recoveryKey;
        }
        return out;
      }

      case "vault_retrieve": {
        const secret = await VaultService.retrieveSecret(userId, args.key_name, args.passphrase);
        return {
          status: "decrypted",
          key_name: args.key_name,
          secret_value: secret,
        };
      }

      case "vault_list": {
        const keys = await VaultService.listKeys(userId);
        return {
          total: keys.length,
          keys: keys.map((k) => ({
            key_name: k.key_name,
            hash: k.hash,
            created_at: new Date(k.created_at * 1000).toISOString(),
          })),
        };
      }

      default:
        throw new Error(`Unknown MCP tool: ${name}`);
    }
  }
}
