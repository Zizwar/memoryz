export function generateOpenApiSpec(origin: string, token: string = ""): any {
  return {
    openapi: "3.1.0",
    info: {
      title: "MemoryZ Living Agentic Memory",
      version: "1.0.0",
      description: "Sovereign Living Memory Substrate for Mobile & Agentic Chat integration. Allows AI assistants to store, recall, and link memories, as well as access the Zero-Knowledge Vault.",
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
          description: "Retrieve relevant memories using Gemini vector semantic search, type filters, and decay-weighted scoring. Call this to check facts, preferences, port configurations, and skills.",
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
                      description: "Natural language query to semantically match against memory space (e.g. 'ما هو بورت سيرفر الاختبار')",
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
                      memories: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            hash: { type: "string" },
                            type: { type: "string" },
                            title: { type: "string" },
                            content: { type: "string" },
                            recall_count: { type: "integer" },
                            recall_score: { type: "number" },
                            score: { type: "number" },
                          },
                        },
                      },
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
