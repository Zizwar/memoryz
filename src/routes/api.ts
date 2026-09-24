import { AuthService, User } from "../services/auth.ts";
import { MemoryService, MemoryType, RelationType } from "../services/memory.ts";
import { VaultService } from "../services/vault.ts";
import { TaskService, TaskPriority } from "../services/task.ts";
import { LogService, LogLevel } from "../services/log.ts";
import { ContextService } from "../services/context.ts";
import { registerWebhook, listWebhooks, deleteWebhook } from "../services/webhook.ts";
import { runMemoryMaintenance } from "../services/cron.ts";
import { R2Service } from "../services/r2.ts";

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
    return json({ status: "ok", service: "MemoryZ Substrate v2", timestamp: Date.now() });
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

  // Raw R2 Object Streaming (Public / Direct asset serving)
  if (path.startsWith("/api/r2/raw/") && (method === "GET" || method === "HEAD")) {
    const rawKey = decodeURIComponent(path.replace("/api/r2/raw/", ""));
    const bucket = url.searchParams.get("bucket") || undefined;
    const isDownload = url.searchParams.get("download") === "true";
    try {
      const obj = await R2Service.getObject(rawKey, bucket);
      if (!obj || !obj.body) {
        return new Response("Object not found in Cloudflare R2", { status: 404 });
      }
      const headers = new Headers();
      headers.set("Content-Type", obj.contentType);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Access-Control-Allow-Origin", "*");
      if (obj.size) headers.set("Content-Length", obj.size.toString());
      if (obj.etag) headers.set("ETag", obj.etag);
      const filename = rawKey.split("/").pop() || "file";
      headers.set(
        "Content-Disposition",
        `${isDownload ? "attachment" : "inline"}; filename="${encodeURIComponent(filename)}"`
      );
      return new Response(method === "HEAD" ? null : obj.body, { status: 200, headers });
    } catch (err) {
      return new Response(`R2 Error: ${(err as Error).message}`, { status: 500 });
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
      } else {
        currentUser = await AuthService.findByApiKey(token);
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

  // ==========================================
  // 1. Memories Endpoints
  // ==========================================

  // Recall
  if (path === "/api/memories/recall" && (method === "POST" || method === "GET")) {
    try {
      let query: string | undefined;
      let type: MemoryType | undefined;
      let limit = 10;
      let format: string | undefined;
      let namespace: string | undefined;

      if (method === "POST") {
        const body = await req.json();
        query = body.query;
        type = body.type;
        format = body.format;
        namespace = body.namespace;
        if (body.limit) limit = parseInt(body.limit, 10);
      } else {
        query = url.searchParams.get("query") || undefined;
        type = (url.searchParams.get("type") as MemoryType) || undefined;
        format = url.searchParams.get("format") || undefined;
        namespace = url.searchParams.get("namespace") || undefined;
        const limParam = url.searchParams.get("limit");
        if (limParam) limit = parseInt(limParam, 10);
      }

      const memories = await MemoryService.recall({
        userId: currentUser.id,
        query,
        type,
        limit,
        namespace,
      });

      if (format === "compact") {
        return json({
          count: memories.length,
          formatted: MemoryService.formatCompact(memories),
          items: memories.map((m) => ({
            hash: m.hash,
            type: m.type,
            title: m.title,
            snippet: m.content.length > 150 ? m.content.substring(0, 150) + "..." : m.content,
            recall_score: m.recall_score,
          })),
        });
      }

      if (format === "summary") {
        return json({
          count: memories.length,
          summary: MemoryService.formatSummary(memories),
        });
      }

      return json({ count: memories.length, memories });
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  // List / Store
  if (path === "/api/memories") {
    if (method === "GET") {
      const type = (url.searchParams.get("type") as MemoryType) || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const namespace = url.searchParams.get("namespace") || undefined;
      const memories = await MemoryService.list(currentUser.id, type, limit, namespace);
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
          namespace: body.namespace,
          agentId: body.agent_id,
          source: body.source,
        });
        return json(memory, 201);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
  }

  // Link
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

  // Single memory item (GET / PUT / DELETE)
  if (path.startsWith("/api/memories/") && !path.includes("/recall")) {
    const hash = path.replace("/api/memories/", "");
    if (method === "GET") {
      const includeLinks = url.searchParams.get("include_links") === "true";
      const found = await MemoryService.getByHash(currentUser.id, [hash], includeLinks);
      if (found.length === 0) return json({ error: "Memory not found" }, 404);
      return json(found[0]);
    }

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

  // ==========================================
  // 2. Hierarchical Tasks & Multi-Agent TODOs
  // ==========================================

  // Tasks: Tree View
  if (path === "/api/tasks/tree" && method === "GET") {
    try {
      const status = url.searchParams.get("status") || undefined;
      const format = url.searchParams.get("format") || "json";
      const namespace = url.searchParams.get("namespace") || undefined;
      const tree = await TaskService.getTree(currentUser.id, { status, namespace });

      if (format === "ascii" || format === "text") {
        return new Response(TaskService.formatTreeAscii(tree), {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }

      return json({ tree, total_roots: tree.length });
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  // Tasks: List / Create
  if (path === "/api/tasks") {
    if (method === "GET") {
      try {
        const status = url.searchParams.get("status") || undefined;
        const parentId = url.searchParams.get("parent_id") || undefined;
        const assignee = url.searchParams.get("assignee") || undefined;
        const format = url.searchParams.get("format") || "json";
        const namespace = url.searchParams.get("namespace") || undefined;
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : undefined;

        if (format === "tree") {
          const tree = await TaskService.getTree(currentUser.id, { status, namespace });
          return json({ tree, total_roots: tree.length, ascii: TaskService.formatTreeAscii(tree) });
        }

        const tasks = await TaskService.list(currentUser.id, {
          status,
          parentId,
          assignee,
          namespace,
          limit,
        });

        if (format === "compact") {
          return json({
            count: tasks.length,
            formatted: TaskService.formatCompactList(tasks),
            tasks,
          });
        }

        return json({ count: tasks.length, tasks });
      } catch (err) {
        return json({ error: (err as Error).message }, 500);
      }
    }

    if (method === "POST") {
      try {
        const body = await req.json();
        const task = await TaskService.create({
          userId: currentUser.id,
          title: body.title,
          parentId: body.parent_id,
          description: body.description,
          status: body.status,
          priority: body.priority as TaskPriority,
          assignee: body.assignee,
          metadata: body.metadata,
          orderIndex: body.order_index,
          namespace: body.namespace,
        });
        return json(task, 201);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
  }

  // Tasks: Atomic multi-agent claim / release
  if (path.startsWith("/api/tasks/") && path.endsWith("/claim") && method === "POST") {
    try {
      const taskId = path.replace("/api/tasks/", "").replace("/claim", "");
      const body = await req.json().catch(() => ({}));
      const agentId = body.agent_id || url.searchParams.get("agent_id");
      if (!agentId) return json({ error: "agent_id is required" }, 400);

      if (body.release === true) {
        const released = await TaskService.release(currentUser.id, taskId, agentId);
        return json({ success: released, status: released ? "released" : "not_claimed_by_you" });
      }

      const result = await TaskService.claim(currentUser.id, taskId, agentId);
      if (!result.success) {
        return json(
          {
            success: false,
            reason: result.reason,
            locked_by: result.task?.locked_by ?? null,
          },
          result.reason === "not_found" ? 404 : 409
        );
      }
      return json({ success: true, task: result.task });
    } catch (err) {
      return json({ error: (err as Error).message }, 400);
    }
  }

  // Tasks: Single item (GET / PUT / DELETE)
  if (path.startsWith("/api/tasks/") && path !== "/api/tasks/tree") {
    const taskId = path.replace("/api/tasks/", "");

    if (method === "GET") {
      const task = await TaskService.get(currentUser.id, taskId);
      if (!task) return json({ error: "Task not found" }, 404);
      return json(task);
    }

    if (method === "PUT") {
      try {
        const body = await req.json();
        const updated = await TaskService.update(currentUser.id, taskId, {
          title: body.title,
          parentId: body.parent_id,
          description: body.description,
          status: body.status,
          priority: body.priority as TaskPriority,
          assignee: body.assignee,
          metadata: body.metadata,
          orderIndex: body.order_index,
        });
        return json(updated);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }

    if (method === "DELETE") {
      const cascade = url.searchParams.get("cascade") !== "false";
      const success = await TaskService.delete(currentUser.id, taskId, cascade);
      return json({ success });
    }
  }

  // ==========================================
  // 3. Ephemeral Logs & Scratchpad
  // ==========================================
  if (path === "/api/logs") {
    if (method === "GET") {
      try {
        const level = (url.searchParams.get("level") as LogLevel) || undefined;
        const source = url.searchParams.get("source") || undefined;
        const limit = parseInt(url.searchParams.get("limit") || "50", 10);
        const format = url.searchParams.get("format") || "json";

        const logs = await LogService.list(currentUser.id, { level, source, limit });
        if (format === "compact") {
          return json({
            count: logs.length,
            formatted: LogService.formatCompact(logs),
            logs,
          });
        }
        return json({ count: logs.length, logs });
      } catch (err) {
        return json({ error: (err as Error).message }, 500);
      }
    }

    if (method === "POST") {
      try {
        const body = await req.json();
        const log = await LogService.append({
          userId: currentUser.id,
          message: body.message,
          level: body.level as LogLevel,
          source: body.source,
          metadata: body.metadata,
        });
        return json(log, 201);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
  }

  // ==========================================
  // 4. Token-Budgeted Context & Snapshots
  // ==========================================

  // Dynamic Context Pack
  if (path === "/api/context/pack" && (method === "GET" || method === "POST")) {
    try {
      let query: string | undefined;
      let tokenBudget = 1200;
      let includeTasks = true;
      let includeLogs = false;
      let format: "xml" | "markdown" | "compact" = "xml";

      if (method === "POST") {
        const body = await req.json();
        query = body.query;
        if (body.token_budget) tokenBudget = parseInt(body.token_budget, 10);
        if (body.include_tasks !== undefined) includeTasks = body.include_tasks;
        if (body.include_logs !== undefined) includeLogs = body.include_logs;
        if (body.format) format = body.format;
      } else {
        query = url.searchParams.get("query") || undefined;
        const budgetParam = url.searchParams.get("tokens") || url.searchParams.get("token_budget");
        if (budgetParam) tokenBudget = parseInt(budgetParam, 10);
        if (url.searchParams.get("include_tasks") === "false") includeTasks = false;
        if (url.searchParams.get("include_logs") === "true") includeLogs = true;
        const fmtParam = url.searchParams.get("format");
        if (fmtParam === "markdown" || fmtParam === "compact" || fmtParam === "xml") {
          format = fmtParam;
        }
      }

      const pack = await ContextService.buildContextPack({
        userId: currentUser.id,
        query,
        tokenBudget,
        includeTasks,
        includeLogs,
        format,
      });

      return json(pack);
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  // Context Snapshots: List / Save
  if (path === "/api/context/snapshots") {
    if (method === "GET") {
      const snapshots = await ContextService.listSnapshots(currentUser.id);
      return json({ count: snapshots.length, snapshots });
    }

    if (method === "POST") {
      try {
        const body = await req.json();
        const snap = await ContextService.saveSnapshot(
          currentUser.id,
          body.name,
          body.content,
          body.description,
          body.metadata
        );
        return json(snap, 201);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
  }

  // Context Snapshots: Single item
  if (path.startsWith("/api/context/snapshots/")) {
    const snapName = decodeURIComponent(path.replace("/api/context/snapshots/", ""));
    if (method === "GET") {
      const snap = await ContextService.getSnapshot(currentUser.id, snapName);
      if (!snap) return json({ error: "Snapshot not found" }, 404);
      return json(snap);
    }

    if (method === "DELETE") {
      const success = await ContextService.deleteSnapshot(currentUser.id, snapName);
      return json({ success });
    }
  }

  // ==========================================
  // 5. Zero-Knowledge Secret Vault
  // ==========================================

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

  // Webhooks: List & Register
  if (path === "/api/webhooks") {
    if (method === "GET") {
      const ns = url.searchParams.get("namespace") || undefined;
      const list = await listWebhooks(currentUser.id, ns);
      return json({ count: list.length, webhooks: list });
    }

    if (method === "POST") {
      try {
        const body = await req.json();
        const wh = await registerWebhook({
          userId: currentUser.id,
          url: body.url,
          events: body.events,
          secret: body.secret,
          namespace: body.namespace,
          metadata: body.metadata,
        });
        return json(wh, 201);
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    }
  }

  // Webhooks: Delete
  if (path.startsWith("/api/webhooks/")) {
    const whId = path.replace("/api/webhooks/", "");
    if (method === "DELETE") {
      const success = await deleteWebhook(whId, currentUser.id);
      return json({ success, id: whId });
    }
  }

  // Cron Maintenance: Manual Trigger
  if (path === "/api/cron/run" && method === "POST") {
    try {
      const res = await runMemoryMaintenance();
      return json({ success: true, result: res });
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  // Tasks: Release Claim Lock
  if (path.startsWith("/api/tasks/") && path.endsWith("/release") && method === "POST") {
    const taskId = path.replace("/api/tasks/", "").replace("/release", "");
    try {
      const body = await req.json().catch(() => ({}));
      const agentId = body.agent_id || "admin";
      const success = await TaskService.release(currentUser.id, taskId, agentId);
      return json({ success, taskId });
    } catch (err) {
      return json({ error: (err as Error).message }, 400);
    }
  }

  // ==========================================
  // 6. Cloudflare R2 Storage Endpoints
  // ==========================================

  // List R2 Buckets
  if (path === "/api/r2/buckets" && method === "GET") {
    try {
      const buckets = await R2Service.listBuckets();
      return json({ count: buckets.length, buckets });
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  // List R2 Objects
  if (path === "/api/r2/objects" && method === "GET") {
    try {
      const bucket = url.searchParams.get("bucket") || undefined;
      const prefix = url.searchParams.get("prefix") || undefined;
      const namespace = url.searchParams.get("namespace") || undefined;
      const cursor = url.searchParams.get("cursor") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);

      // If namespace is specified and prefix is empty, filter by namespace folder
      let effectivePrefix = prefix;
      if (!effectivePrefix && namespace && namespace !== "all" && namespace !== "default") {
        effectivePrefix = `${namespace}/`;
      }

      const res = await R2Service.listObjects({
        bucket,
        prefix: effectivePrefix,
        cursor,
        limit,
      });

      return json({ ...res, bucket: bucket || "memoryz" });
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  // Upload R2 Object (Supports multipart/form-data, json with base64/content, or raw binary)
  if (path === "/api/r2/upload" && method === "POST") {
    try {
      const contentTypeHeader = req.headers.get("content-type") || "";
      const bucket = url.searchParams.get("bucket") || undefined;
      const namespace = url.searchParams.get("namespace") || undefined;

      // 1. Multipart Form Data (Browser file upload)
      if (contentTypeHeader.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file");
        if (!file || !(file instanceof File)) {
          return json({ error: "Missing file field in form-data" }, 400);
        }

        const customKey = (formData.get("key") as string) || (formData.get("path") as string);
        const formNamespace = (formData.get("namespace") as string) || namespace;
        const formBucket = (formData.get("bucket") as string) || bucket;
        const key = customKey ? customKey.trim() : file.name;

        const bytes = new Uint8Array(await file.arrayBuffer());
        const result = await R2Service.uploadObject({
          key,
          data: bytes,
          contentType: file.type || undefined,
          bucket: formBucket,
          namespace: formNamespace,
        });

        return json(result, 201);
      }

      // 2. JSON Body (Base64 or UTF-8 text payload)
      if (contentTypeHeader.includes("application/json")) {
        const body = await req.json();
        const key = body.key || body.filename || `file-${Date.now()}`;
        let data: Uint8Array | string = body.content || "";
        if (body.base64) {
          const binaryStr = atob(body.base64);
          data = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
        }

        const result = await R2Service.uploadObject({
          key,
          data,
          contentType: body.content_type || body.contentType,
          bucket: body.bucket || bucket,
          namespace: body.namespace || namespace,
          metadata: body.metadata,
        });

        return json(result, 201);
      }

      // 3. Raw Body
      const key = url.searchParams.get("key") || `raw-${Date.now()}`;
      const bytes = new Uint8Array(await req.arrayBuffer());
      const result = await R2Service.uploadObject({
        key,
        data: bytes,
        contentType: contentTypeHeader || undefined,
        bucket,
        namespace,
      });

      return json(result, 201);
    } catch (err) {
      return json({ error: (err as Error).message }, 400);
    }
  }

  // Delete R2 Object
  if (path.startsWith("/api/r2/objects/") && method === "DELETE") {
    const rawKey = decodeURIComponent(path.replace("/api/r2/objects/", ""));
    const bucket = url.searchParams.get("bucket") || undefined;
    try {
      const res = await R2Service.deleteObject(rawKey, bucket);
      return json(res);
    } catch (err) {
      return json({ error: (err as Error).message }, 500);
    }
  }

  return json({ error: "Endpoint not found" }, 404);
}
