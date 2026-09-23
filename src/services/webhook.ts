import { getDb } from "../db/client.ts";

export interface WebhookRecord {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  secret: string | null;
  namespace: string;
  is_active: number;
  failure_count: number;
  last_called_at: number | null;
  last_status_code: number | null;
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface RegisterWebhookParams {
  userId: string;
  url: string;
  events?: string[]; // e.g. ["task.status_changed", "task.done", "task.claimed", "memory.created", "*"]
  secret?: string;
  namespace?: string;
  metadata?: Record<string, unknown>;
}

export async function registerWebhook(params: RegisterWebhookParams): Promise<WebhookRecord> {
  const db = getDb();
  const id = `wh_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const now = Math.floor(Date.now() / 1000);
  const events = params.events && params.events.length > 0 ? params.events : ["*"];
  const namespace = params.namespace || "default";
  const metadata = params.metadata || {};

  await db.execute({
    sql: `
      INSERT INTO webhooks (
        id, user_id, url, events, secret, namespace, is_active, failure_count, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)
    `,
    args: [
      id,
      params.userId,
      params.url,
      JSON.stringify(events),
      params.secret || null,
      namespace,
      JSON.stringify(metadata),
      now,
      now,
    ],
  });

  return {
    id,
    user_id: params.userId,
    url: params.url,
    events,
    secret: params.secret || null,
    namespace,
    is_active: 1,
    failure_count: 0,
    last_called_at: null,
    last_status_code: null,
    metadata,
    created_at: now,
    updated_at: now,
  };
}

export async function listWebhooks(userId: string, namespace?: string): Promise<WebhookRecord[]> {
  const db = getDb();
  let sql = `SELECT * FROM webhooks WHERE user_id = ?`;
  const args: any[] = [userId];

  if (namespace && namespace !== "*") {
    sql += ` AND (namespace = ? OR namespace = 'default' OR namespace = '*')`;
    args.push(namespace);
  }

  sql += ` ORDER BY created_at DESC`;
  const res = await db.execute({ sql, args });

  return res.rows.map((row: any) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    url: String(row.url),
    events: JSON.parse(String(row.events || '["*"]')),
    secret: row.secret ? String(row.secret) : null,
    namespace: String(row.namespace || "default"),
    is_active: Number(row.is_active || 1),
    failure_count: Number(row.failure_count || 0),
    last_called_at: row.last_called_at ? Number(row.last_called_at) : null,
    last_status_code: row.last_status_code ? Number(row.last_status_code) : null,
    metadata: JSON.parse(String(row.metadata || "{}")),
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  }));
}

export async function deleteWebhook(id: string, userId: string): Promise<boolean> {
  const db = getDb();
  const res = await db.execute({
    sql: `DELETE FROM webhooks WHERE id = ? AND user_id = ?`,
    args: [id, userId],
  });
  return (res.rowsAffected ?? 0) > 0;
}

/**
 * Signs payload with HMAC-SHA256
 */
async function computeHmacSha256(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface DispatchEventParams {
  userId: string;
  event: string; // e.g. "task.status_changed", "task.done", "task.claimed", "memory.created"
  namespace?: string;
  payload: Record<string, unknown>;
}

/**
 * Dispatches an event to all matching active webhooks asynchronously (non-blocking).
 */
export async function dispatchWebhookEvent(params: DispatchEventParams): Promise<void> {
  try {
    const db = getDb();
    const namespace = params.namespace || "default";

    const res = await db.execute({
      sql: `
        SELECT * FROM webhooks
        WHERE user_id = ? AND is_active = 1
        AND (namespace = ? OR namespace = 'default' OR namespace = '*')
      `,
      args: [params.userId, namespace],
    });

    if (res.rows.length === 0) return;

    const payloadObj = {
      event: params.event,
      timestamp: Math.floor(Date.now() / 1000),
      namespace,
      data: params.payload,
    };
    const bodyStr = JSON.stringify(payloadObj);

    // Fire in background for each matching webhook
    for (const row of res.rows) {
      const whId = String(row.id);
      const url = String(row.url);
      const secret = row.secret ? String(row.secret) : null;
      let allowedEvents: string[] = [];
      try {
        allowedEvents = JSON.parse(String(row.events || '["*"]'));
      } catch (_e) {
        allowedEvents = ["*"];
      }

      // Check if subscribed to this event or wildcard
      const isSubscribed = allowedEvents.includes("*") || allowedEvents.includes(params.event);
      if (!isSubscribed) continue;

      (async () => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "MemoryZ-Webhook/3.0",
          "x-memoryz-event": params.event,
          "x-memoryz-timestamp": String(payloadObj.timestamp),
        };

        if (secret) {
          try {
            const sig = await computeHmacSha256(secret, bodyStr);
            headers["x-memoryz-signature"] = `sha256=${sig}`;
          } catch (e) {
            console.error(`HMAC signature generation failed for webhook ${whId}:`, e);
          }
        }

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout
          const resp = await fetch(url, {
            method: "POST",
            headers,
            body: bodyStr,
            signal: controller.signal,
          });
          clearTimeout(timer);

          const now = Math.floor(Date.now() / 1000);
          await db.execute({
            sql: `UPDATE webhooks SET last_called_at = ?, last_status_code = ?, updated_at = ? WHERE id = ?`,
            args: [now, resp.status, now, whId],
          });
        } catch (fetchErr) {
          const now = Math.floor(Date.now() / 1000);
          console.warn(`Webhook dispatch error for ${url} (${whId}):`, (fetchErr as Error).message);
          try {
            await db.execute({
              sql: `UPDATE webhooks SET failure_count = failure_count + 1, last_called_at = ?, updated_at = ? WHERE id = ?`,
              args: [now, now, whId],
            });
          } catch (_e) {}
        }
      })();
    }
  } catch (err) {
    console.error("dispatchWebhookEvent critical error:", err);
  }
}
