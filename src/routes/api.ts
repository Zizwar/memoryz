import { AuthService, User } from "../services/auth.ts";
import { MemoryService, MemoryType, RelationType } from "../services/memory.ts";
import { VaultService } from "../services/vault.ts";

export async function handleApiRoute(req: Request, url: URL): Promise<Response> {
  const path = url.pathname;
  const method = req.method;

  // JSON helper
  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      },
    });

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      },
    });
  }

  // Health check
  if (path === "/api/health") {
    return json({ status: "ok", service: "MemoryZ Substrate", timestamp: Date.now() });
  }

  // Auth: Register
  if (path === "/api/auth/register" && method === "POST") {
    try {
      const body = await req.json();
      const session = await AuthService.register(body.username, body.email, body.password);
      return json(session);
    } catch (err) {
      return json({ error: (err as Error).message }, 400);
    }
  }

  // Auth: Login
  if (path === "/api/auth/login" && method === "POST") {
    try {
      const body = await req.json();
      const session = await AuthService.login(body.identifier, body.password);
      return json(session);
    } catch (err) {
      return json({ error: (err as Error).message }, 401);
    }
  }

  // Extract User Context from Authorization Header, X-API-Key, or query param (?token=, ?key=)
  let currentUser: User | null = null;
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("X-API-Key");
  const queryToken = url.searchParams.get("token") || url.searchParams.get("key") || url.searchParams.get("api_key");

  if (apiKeyHeader) {
    currentUser = await AuthService.findByApiKey(apiKeyHeader);
  } else if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = await AuthService.verifyToken(token);
      if (decoded) {
        currentUser = await AuthService.findById(decoded.sub);
      }
    } else if (authHeader.startsWith("Key ")) {
      const key = authHeader.substring(4);
      currentUser = await AuthService.findByApiKey(key);
    }
  } else if (queryToken) {
    currentUser = await AuthService.findByApiKey(queryToken);
    if (!currentUser) {
      const decoded = await AuthService.verifyToken(queryToken);
      if (decoded) {
        currentUser = await AuthService.findById(decoded.sub);
      }
    }
  }

  if (!currentUser) {
    return json({ error: "Unauthorized. Provide Bearer token or X-API-Key." }, 401);
  }

  // Current User info
  if (path === "/api/auth/me" && method === "GET") {
    return json({ user: currentUser });
  }

  // Admin Dashboard Stats
  if (path === "/api/admin/stats" && method === "GET") {
    if (currentUser.role !== "admin") {
      return json({ error: "Forbidden. Admin privileges required." }, 403);
    }
    const stats = await AuthService.getPlatformStats();
    return json(stats);
  }

  // Memories: Recall
  if (path === "/api/memories/recall" && (method === "POST" || method === "GET")) {
    try {
      let query: string | undefined;
      let type: MemoryType | undefined;
      let limit = 10;

      if (method === "POST") {
        const body = await req.json();
        query = body.query;
        type = body.type;
        if (body.limit) limit = parseInt(body.limit, 10);
      } else {
        query = url.searchParams.get("query") || undefined;
        type = (url.searchParams.get("type") as MemoryType) || undefined;
        const limParam = url.searchParams.get("limit");
        if (limParam) limit = parseInt(limParam, 10);
      }

      const memories = await MemoryService.recall({
        userId: currentUser.id,
        query,
        type,
        limit,
      });

      return json({ count: memories.length, memories });
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  // Memories: List / Store
  if (path === "/api/memories") {
    if (method === "GET") {
      const type = (url.searchParams.get("type") as MemoryType) || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const memories = await MemoryService.list(currentUser.id, type, limit);
      return json({ count: memories.length, memories });
    }

    if (method === "POST") {
      try {
        const body = await req.json();
        const memory = await MemoryService.store({
          userId: currentUser.id,
          type: body.type,
          content: body.content,
          title: body.title,
          metadata: body.metadata,
        });
        return json(memory, 201);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
  }

  // Memories: Link
  if (path === "/api/memories/link" && method === "POST") {
    try {
      const body = await req.json();
      await MemoryService.linkMemories(
        currentUser.id,
        body.source_hash,
        body.target_hash,
        body.relation_type as RelationType,
        body.weight || 1.0
      );
      return json({ success: true, message: "Memories linked successfully" });
    } catch (err) {
      return json({ error: (err as Error).message }, 400);
    }
  }

  // Memories: Single item (PUT / DELETE)
  if (path.startsWith("/api/memories/")) {
    const hash = path.replace("/api/memories/", "");
    if (method === "PUT") {
      try {
        const body = await req.json();
        const success = await MemoryService.updateMemory(
          currentUser.id,
          hash,
          body.content,
          body.title,
          body.metadata
        );
        return json({ success });
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }

    if (method === "DELETE") {
      const success = await MemoryService.deleteMemory(currentUser.id, hash);
      return json({ success });
    }
  }

  // Vault: List / Store
  if (path === "/api/vault") {
    if (method === "GET") {
      const keys = await VaultService.listKeys(currentUser.id);
      return json({ count: keys.length, keys });
    }

    if (method === "POST") {
      try {
        const body = await req.json();
        const res = await VaultService.storeSecret(
          currentUser.id,
          body.key_name,
          body.secret_value,
          body.passphrase
        );
        return json(res, 201);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
  }

  // Vault: Retrieve
  if (path === "/api/vault/retrieve" && method === "POST") {
    try {
      const body = await req.json();
      const secret = await VaultService.retrieveSecret(
        currentUser.id,
        body.key_name,
        body.passphrase
      );
      return json({ key_name: body.key_name, secret_value: secret });
    } catch (err) {
      return json({ error: (err as Error).message }, 400);
    }
  }

  // Vault: Delete
  if (path.startsWith("/api/vault/")) {
    const keyName = decodeURIComponent(path.replace("/api/vault/", ""));
    if (method === "DELETE") {
      const success = await VaultService.deleteSecret(currentUser.id, keyName);
      return json({ success });
    }
  }

  return json({ error: "Endpoint not found" }, 404);
}
