/**
 * Cloudflare R2 Storage Substrate Service for MemoryZ
 * 
 * Provides object storage, asset hosting, project artifacts management,
 * and direct streaming through native Cloudflare R2 REST API.
 */

import { config } from "../config.ts";
import { SettingsService } from "./settings.ts";
import { getDb } from "../db/client.ts";
import { VaultService } from "./vault.ts";

export interface R2ObjectInfo {
  key: string;
  size: number;
  etag: string;
  last_modified: string;
  content_type: string;
  storage_class: string;
  url: string;
  download_url: string;
  full_url: string;
}

export interface R2BucketInfo {
  name: string;
  creation_date: string;
  location?: string;
  storage_class?: string;
}

export interface R2Credentials {
  accountId: string;
  apiToken: string;
  bucket: string;
  apiBase: string;
  accountUrl: string;
  getHeaders: (contentType?: string) => Record<string, string>;
}

export class R2Service {
  private static cachedCredentials: {
    accountId: string;
    apiToken: string;
    defaultBucket: string;
    timestamp: number;
  } | null = null;

  /**
   * Invalidate cached credentials (e.g. after settings update)
   */
  static clearCache(): void {
    this.cachedCredentials = null;
  }

  /**
   * Dynamically resolves R2 credentials with multi-layer fallback:
   * 1. Environment variables / config
   * 2. App Settings table in Turso DB (system settings)
   * 3. Zero-Knowledge Vault (cloudflare_r2_env) if MEMORYZ_VAULT_PASS is set
   */
  private static async getCredentials(requestedBucket?: string): Promise<R2Credentials> {
    const now = Date.now();
    // Cache resolution for 60 seconds to avoid hitting DB on every single chunk
    if (
      !this.cachedCredentials ||
      now - this.cachedCredentials.timestamp > 60_000 ||
      !this.cachedCredentials.apiToken
    ) {
      let accountId = (config.r2AccountId || "").replace(/^["']|["']$/g, "").trim();
      let apiToken = (config.r2ApiToken || "").replace(/^["']|["']$/g, "").trim();
      let defaultBucket = (config.r2DefaultBucket || "memoryz").replace(/^["']|["']$/g, "").trim();

      // Fallback 1: SettingsService (Turso DB app_settings)
      if (!apiToken) {
        const dbToken = await SettingsService.get("r2_api_token", "");
        if (dbToken) apiToken = dbToken.replace(/^["']|["']$/g, "").trim();
      }
      if (!accountId || accountId === "2b9e37321a07ea1c1452c3a1985b6347") {
        const dbAcc = await SettingsService.get("r2_account_id", "");
        if (dbAcc) accountId = dbAcc.replace(/^["']|["']$/g, "").trim();
      }
      const dbBucket = await SettingsService.get("r2_default_bucket", "");
      if (dbBucket) {
        defaultBucket = dbBucket.replace(/^["']|["']$/g, "").trim();
      }

      // Fallback 2: Decrypt from Vault if still missing and vault pass available
      if (!apiToken) {
        try {
          const pass = Deno.env.get("MEMORYZ_VAULT_PASS");
          if (pass) {
            const db = getDb();
            const rows = await db.execute("SELECT user_id, key_name FROM vault_entries WHERE key_name = 'cloudflare_r2_env' LIMIT 1");
            if (rows.rows.length > 0) {
              const secret = await VaultService.retrieveSecret(String(rows.rows[0].user_id), "cloudflare_r2_env", pass);
              for (const line of secret.split("\n")) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith("#")) {
                  const idx = trimmed.indexOf("=");
                  if (idx !== -1) {
                    const k = trimmed.substring(0, idx).trim();
                    let v = trimmed.substring(idx + 1).trim();
                    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                      v = v.slice(1, -1);
                    }
                    if (k === "CLOUDFLARE_R2_TOKEN_VALUE" || k === "R2_API_TOKEN") apiToken = v;
                    if (k === "CLOUDFLARE_ACCOUNT_ID" || k === "R2_ACCOUNT_ID") accountId = v;
                    if (k === "CLOUDFLARE_R2_BUCKET" || k === "R2_BUCKET") defaultBucket = v;
                  }
                }
              }
            }
          }
        } catch (_e) {
          // Vault fallback silent fail
        }
      }

      // Final sanitize
      accountId = (accountId || "2b9e37321a07ea1c1452c3a1985b6347").replace(/^["']|["']$/g, "").trim();
      apiToken = apiToken.replace(/^["']|["']$/g, "").trim();
      defaultBucket = (defaultBucket || "memoryz").replace(/^["']|["']$/g, "").trim();

      this.cachedCredentials = {
        accountId,
        apiToken,
        defaultBucket,
        timestamp: now,
      };
    }

    const { accountId, apiToken, defaultBucket } = this.cachedCredentials;
    if (!apiToken) {
      throw new Error(
        "R2 API Token is not configured. Please configure CLOUDFLARE_R2_TOKEN_VALUE in environment or r2_api_token in app settings."
      );
    }

    const bucket = requestedBucket || defaultBucket;
    return {
      accountId,
      apiToken,
      bucket,
      apiBase: `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects`,
      accountUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
      getHeaders: (contentType?: string): Record<string, string> => {
        const headers: Record<string, string> = {
          "Authorization": `Bearer ${apiToken}`,
        };
        if (contentType) {
          headers["Content-Type"] = contentType;
        }
        return headers;
      },
    };
  }

  /**
   * List all R2 buckets under the Cloudflare account
   */
  static async listBuckets(): Promise<R2BucketInfo[]> {
    try {
      const creds = await this.getCredentials();
      const res = await fetch(creds.accountUrl, {
        method: "GET",
        headers: creds.getHeaders("application/json"),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Cloudflare API ${res.status}: ${text}`);
      }

      const data = await res.json();
      return (data.result?.buckets || []).map((b: any) => ({
        name: b.name,
        creation_date: b.creation_date,
        location: b.location,
        storage_class: b.storage_class,
      }));
    } catch (err) {
      console.error("[R2Service.listBuckets] Error:", err);
      // Fallback with default bucket
      return [{
        name: config.r2DefaultBucket || "memoryz",
        creation_date: new Date().toISOString(),
      }];
    }
  }

  /**
   * List objects in an R2 bucket with optional prefix or namespace filtering
   */
  static async listObjects(options: {
    bucket?: string;
    prefix?: string;
    cursor?: string;
    limit?: number;
  } = {}): Promise<{ count: number; objects: R2ObjectInfo[]; truncated: boolean; cursor?: string }> {
    const creds = await this.getCredentials(options.bucket);

    const params = new URLSearchParams();
    if (options.prefix) params.set("prefix", options.prefix.trim());
    if (options.cursor) params.set("cursor", options.cursor);
    if (options.limit) params.set("per_page", options.limit.toString());

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${creds.apiBase}${qs}`, {
      method: "GET",
      headers: creds.getHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`R2 list objects failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const rawList = Array.isArray(data.result) ? data.result : (data.result?.objects || []);

    const objects: R2ObjectInfo[] = rawList.map((item: any) => {
      const key = item.key;
      const contentType = item.http_metadata?.contentType || item.custom_metadata?.["content-type"] || this.guessContentType(key);
      const size = Number(item.size || 0);

      return {
        key,
        size,
        etag: item.etag || "",
        last_modified: item.last_modified || item.uploaded || "",
        content_type: contentType,
        storage_class: item.storage_class || "Standard",
        url: `/api/r2/raw/${encodeURIComponent(key)}?bucket=${encodeURIComponent(creds.bucket)}`,
        download_url: `/api/r2/raw/${encodeURIComponent(key)}?bucket=${encodeURIComponent(creds.bucket)}&download=true`,
        full_url: `https://memoryz.wino.deno.net/api/r2/raw/${encodeURIComponent(key)}?bucket=${encodeURIComponent(creds.bucket)}`,
      };
    });

    return {
      count: objects.length,
      objects,
      truncated: !!data.result_info?.is_truncated,
      cursor: data.result_info?.cursor,
    };
  }

  /**
   * Upload an object/file to Cloudflare R2
   */
  static async uploadObject(options: {
    key: string;
    data: Uint8Array | string | ReadableStream;
    contentType?: string;
    bucket?: string;
    namespace?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    success: boolean;
    key: string;
    size: number;
    url: string;
    download_url: string;
    full_url: string;
    bucket: string;
    etag?: string;
  }> {
    const creds = await this.getCredentials(options.bucket);
    
    // Clean key and prepend namespace folder if specified and not already in key
    let cleanKey = options.key.trim().replace(/^\/+/, "");
    if (options.namespace && options.namespace !== "all" && options.namespace !== "default") {
      if (!cleanKey.startsWith(`${options.namespace}/`)) {
        cleanKey = `${options.namespace}/${cleanKey}`;
      }
    }

    const contentType = options.contentType || this.guessContentType(cleanKey);
    const targetUrl = `${creds.apiBase}/${encodeURI(cleanKey)}`;

    let bodyData: any = options.data;
    let size = 0;
    if (typeof options.data === "string") {
      const enc = new TextEncoder().encode(options.data);
      bodyData = enc;
      size = enc.byteLength;
    } else if (options.data instanceof Uint8Array) {
      size = options.data.byteLength;
    }

    const headers = creds.getHeaders(contentType);

    if (size > 0) {
      headers["Content-Length"] = size.toString();
    }

    const res = await fetch(targetUrl, {
      method: "PUT",
      headers,
      body: bodyData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`R2 Upload failed HTTP ${res.status}: ${errText}`);
    }

    const jsonRes = await res.json().catch(() => null);
    const etag = jsonRes?.result?.etag || res.headers.get("etag") || "";
    const returnedSize = Number(jsonRes?.result?.size || size);

    const relativeUrl = `/api/r2/raw/${encodeURIComponent(cleanKey)}?bucket=${encodeURIComponent(creds.bucket)}`;
    const downloadUrl = `${relativeUrl}&download=true`;
    const fullUrl = `https://memoryz.wino.deno.net${relativeUrl}`;

    return {
      success: true,
      key: cleanKey,
      size: returnedSize,
      etag,
      bucket: creds.bucket,
      url: relativeUrl,
      download_url: downloadUrl,
      full_url: fullUrl,
    };
  }

  /**
   * Fetch/Stream an object directly from Cloudflare R2
   */
  static async getObject(key: string, bucket?: string): Promise<{
    body: ReadableStream<Uint8Array> | null;
    contentType: string;
    size?: number;
    etag?: string;
  } | null> {
    const creds = await this.getCredentials(bucket);
    const cleanKey = key.trim().replace(/^\/+/, "");
    const targetUrl = `${creds.apiBase}/${encodeURI(cleanKey)}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: creds.getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      const text = await res.text();
      throw new Error(`R2 Get failed HTTP ${res.status}: ${text}`);
    }

    const contentType = res.headers.get("content-type") || this.guessContentType(cleanKey);
    const sizeHeader = res.headers.get("content-length");
    const size = sizeHeader ? parseInt(sizeHeader, 10) : undefined;
    const etag = res.headers.get("etag") || undefined;

    return {
      body: res.body,
      contentType,
      size,
      etag,
    };
  }

  /**
   * Delete an object from Cloudflare R2
   */
  static async deleteObject(key: string, bucket?: string): Promise<{ success: boolean; key: string }> {
    const creds = await this.getCredentials(bucket);
    const cleanKey = key.trim().replace(/^\/+/, "");
    const targetUrl = `${creds.apiBase}/${encodeURI(cleanKey)}`;

    const res = await fetch(targetUrl, {
      method: "DELETE",
      headers: creds.getHeaders(),
    });

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      throw new Error(`R2 Delete failed HTTP ${res.status}: ${text}`);
    }

    return { success: true, key: cleanKey };
  }

  /**
   * Helper to guess MIME content-type from file extension
   */
  static guessContentType(key: string): string {
    const ext = key.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "json": return "application/json";
      case "md": return "text/markdown; charset=utf-8";
      case "txt": return "text/plain; charset=utf-8";
      case "html": return "text/html; charset=utf-8";
      case "css": return "text/css; charset=utf-8";
      case "js":
      case "mjs": return "application/javascript; charset=utf-8";
      case "ts": return "application/typescript; charset=utf-8";
      case "png": return "image/png";
      case "jpg":
      case "jpeg": return "image/jpeg";
      case "webp": return "image/webp";
      case "gif": return "image/gif";
      case "svg": return "image/svg+xml";
      case "pdf": return "application/pdf";
      case "zip": return "application/zip";
      case "tar": return "application/x-tar";
      case "gz": return "application/gzip";
      case "mp3": return "audio/mpeg";
      case "mp4": return "video/mp4";
      default: return "application/octet-stream";
    }
  }

  /**
   * Helper to format bytes to human readable format
   */
  static formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
