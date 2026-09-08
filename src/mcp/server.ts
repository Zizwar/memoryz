import { MemoryService, MemoryType, RelationType } from "../services/memory.ts";
import { VaultService } from "../services/vault.ts";

export const MCP_TOOLS = [
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
      },
      required: ["type", "content"],
    },
  },
  {
    name: "recall_memory",
    description: "Retrieve relevant memories using Gemini vector semantic search, type filters, and decay-weighted scoring. Automatically reinforces recalled items.",
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
  {
    name: "vault_store",
    description: "Securely encrypt and store a confidential secret or API key in the Zero-Knowledge vault using AES-256-GCM. Plaintext is never stored or embedded.",
    inputSchema: {
      type: "object",
      properties: {
        key_name: {
          type: "string",
          description: "Key identifier (e.g. 'key_gemini', 'aws_access_key')",
        },
        secret_value: {
          type: "string",
          description: "Confidential string/secret to encrypt",
        },
        passphrase: {
          type: "string",
          description: "Passphrase used to derive AES-256-GCM encryption key",
        },
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
        key_name: {
          type: "string",
          description: "Key identifier to retrieve",
        },
        passphrase: {
          type: "string",
          description: "Passphrase used for decryption",
        },
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
   * Handle incoming MCP JSON-RPC requests (stateless & compliant with Claude/ChatGPT)
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
            version: "1.0.0",
          },
          instructions:
            "MemoryZ provides persistent living memory across chats and agents. " +
            "Use 'recall_memory' to search facts, preferences, port configurations, and skills. " +
            "Use 'store_memory' to remember rules, facts, or instructions. " +
            "Use 'vault_store' and 'vault_retrieve' for encrypted credentials.",
        },
      };
    }

    if (method === "ping") {
      return { jsonrpc: "2.0", id, result: {} };
    }

    // JSON-RPC Notification (notifications/initialized, etc.) -> MUST return null (no response body)
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
      case "store_memory": {
        const node = await MemoryService.store({
          userId,
          type: args.type as MemoryType,
          content: args.content,
          title: args.title,
          metadata: args.metadata,
        });
        return {
          status: "stored",
          hash: node.hash,
          type: node.type,
          title: node.title,
          message: `Memory stored successfully with 768-dim embedding.`,
        };
      }

      case "recall_memory": {
        const memories = await MemoryService.recall({
          userId,
          query: args.query,
          type: args.type as MemoryType,
          limit: args.limit ? parseInt(args.limit, 10) : 5,
        });
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
