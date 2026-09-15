export function generateOpenApiSpec(origin: string, token: string = ""): any {
  return {
    openapi: "3.1.0",
    info: {
      title: "MemoryZ v2 Living Agentic Memory & Task Substrate",
      version: "2.0.0",
      description: "Sovereign Living Memory & Hierarchical Multi-Agent Task Substrate. Allows AI assistants to store memories, manage hierarchical task trees, append ephemeral logs, and pack token-budgeted prompt context.",
    },
    servers: [
      {
        url: origin,
        description: "MemoryZ Server",
      },
    ],
    paths: {
      "/api/memories/recall": {
        post: {
          summary: "Recall Memories",
          description: "Retrieve relevant memories using Gemini vector semantic search, type filters, and decay-weighted scoring. Supports compact token-saving mode.",
          operationId: "recallMemory",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
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
                      type: "integer",
                      default: 5,
                      description: "Maximum number of memories to return",
                    },
                    format: {
                      type: "string",
                      enum: ["compact", "summary", "full"],
                      description: "Output format: 'compact' saves tokens, 'summary' provides bullets",
                    },
                  },
                  required: ["query"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Matching memory nodes with similarity and recall scores",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      count: { type: "integer" },
                      formatted: { type: "string" },
                      memories: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/memories": {
        post: {
          summary: "Store Memory",
          description: "Store a new memory atom (environment rule, user preference, skill prompt, or note) with automatic 768-dim Gemini vector embedding.",
          operationId: "storeMemory",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["note", "skill", "preference", "env"],
                      description: "Memory classification",
                    },
                    content: {
                      type: "string",
                      description: "The knowledge, rule, or preference to remember",
                    },
                    title: {
                      type: "string",
                      description: "Optional concise title or identifier",
                    },
                    metadata: {
                      type: "object",
                      description: "Optional key-value metadata",
                    },
                  },
                  required: ["type", "content"],
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Memory created successfully",
            },
          },
        },
      },
      "/api/tasks": {
        get: {
          summary: "List Tasks / Hierarchical Tree",
          description: "Retrieve multi-agent tasks. Set format=tree for an ultra-compact token-saving tree representation.",
          operationId: "listTasks",
          parameters: [
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "parent_id", in: "query", schema: { type: "string" } },
            { name: "format", in: "query", schema: { type: "string", enum: ["tree", "compact", "json"] } },
          ],
          responses: {
            "200": { description: "Tasks list or tree" },
          },
        },
        post: {
          summary: "Create Task / Subtask",
          description: "Create a hierarchical task or subtask with flexible status and agent assignment.",
          operationId: "createTask",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    parent_id: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string", default: "todo" },
                    priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                    assignee: { type: "string" },
                  },
                  required: ["title"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Task created" },
          },
        },
      },
      "/api/tasks/{id}": {
        put: {
          summary: "Update Task",
          description: "Update task status (e.g. 'done'), title, priority, or assignee.",
          operationId: "updateTask",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string" },
                    assignee: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Task updated" },
          },
        },
        delete: {
          summary: "Delete Task",
          description: "Delete task and optionally cascade delete all child subtasks.",
          operationId: "deleteTask",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "cascade", in: "query", schema: { type: "boolean", default: true } },
          ],
          responses: {
            "200": { description: "Task deleted" },
          },
        },
      },
      "/api/logs": {
        post: {
          summary: "Append Ephemeral Log",
          description: "Fast lightweight log append without vector embedding latency.",
          operationId: "appendLog",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    level: { type: "string", enum: ["info", "warn", "error", "debug", "trace"] },
                    source: { type: "string" },
                  },
                  required: ["message"],
                },
              },
            },
          },
          responses: { "201": { description: "Log appended" } },
        },
        get: {
          summary: "List Recent Logs",
          operationId: "listLogs",
          responses: { "200": { description: "Recent logs" } },
        },
      },
      "/api/context/pack": {
        post: {
          summary: "Generate Context Pack",
          description: "Build a token-budgeted dense prompt context bundle merging active tasks and relevant memories.",
          operationId: "getContextPack",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    token_budget: { type: "integer", default: 1200 },
                    include_tasks: { type: "boolean", default: true },
                    format: { type: "string", enum: ["xml", "markdown", "compact"] },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Packed context" } },
        },
      },
      "/api/vault/retrieve": {
        post: {
          summary: "Retrieve Vault Secret",
          description: "Decrypt and retrieve a confidential secret (like an API key or password) from the Zero-Knowledge vault using client passphrase. Plaintext is only kept in transient RAM.",
          operationId: "vaultRetrieve",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    key_name: {
                      type: "string",
                      description: "Key identifier (e.g. key_gemini)",
                    },
                    passphrase: {
                      type: "string",
                      description: "Passphrase for AES-GCM decryption",
                    },
                  },
                  required: ["key_name", "passphrase"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Decrypted secret value",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      key_name: { type: "string" },
                      secret_value: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/vault": {
        post: {
          summary: "Store Vault Secret",
          description: "Encrypt and store a sensitive secret in the Zero-Knowledge vault using AES-256-GCM.",
          operationId: "vaultStore",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    key_name: { type: "string" },
                    secret_value: { type: "string" },
                    passphrase: { type: "string" },
                  },
                  required: ["key_name", "secret_value", "passphrase"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Secret encrypted and saved" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: `Provide API key header 'X-API-Key' or 'Authorization: Bearer <TOKEN>' or query '?token=${token || "YOUR_TOKEN"}'`,
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  };
}
