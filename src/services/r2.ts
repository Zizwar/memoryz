/**
 * Cloudflare R2 Storage Substrate Service for MemoryZ
 * 
 * Provides object storage, asset hosting, project artifacts management,
 * and direct streaming through native Cloudflare R2 REST API.
 */

import { config } from "../config.ts";

export interface R2ObjectInfo {
  key: string;
  size: number;
  etag: string;
  last_modified: string;
  content_type: string;
  storage_class: string;
  url: string;
  download_url: string;
}

export interface R2BucketInfo {
  name: string;
  creation_date: string;
  location?: string;
  storage_class?: string;
}

export class R2Service {
  private static getApiBase(bucket?: string): string {
    const b = bucket || config.r2DefaultBucket || "memoryz";
    return `https://api.cloudflare.com/client/v4/accounts/${config.r2AccountId}/r2/buckets/${b}/objects`;
  }

  private static getHeaders(contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${config.r2ApiToken}`,
    };
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    return headers;
  }

  /**
   * List all R2 buckets under the Cloudflare account
   */
  static async listBuckets(): Promise<R2BucketInfo[]> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${config.r2AccountId}/r2/buckets`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders("application/json"),
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
    const bucket = options.bucket || config.r2DefaultBucket || "memoryz";
    const apiBase = this.getApiBase(bucket);

    const params = new URLSearchParams();
    if (options.prefix) params.set("prefix", options.prefix.trim());
    if (options.cursor) params.set("cursor", options.cursor);
    if (options.limit) params.set("per_page", options.limit.toString());

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${apiBase}${qs}`, {
      method: "GET",
      headers: this.getHeaders(),
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
        url: `/api/r2/raw/${encodeURIComponent(key)}?bucket=${encodeURIComponent(bucket)}`,
        download_url: `/api/r2/raw/${encodeURIComponent(key)}?bucket=${encodeURIComponent(bucket)}&download=true`,
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
  }): Promise<{ success: boolean; key: string; size: number; url: string; bucket: string; etag?: string }> {
    const bucket = options.bucket || config.r2DefaultBucket || "memoryz";
    
    // Clean key and prepend namespace folder if specified and not already in key
    let cleanKey = options.key.trim().replace(/^\/+/, "");
    if (options.namespace && options.namespace !== "all" && options.namespace !== "default") {
      if (!cleanKey.startsWith(`${options.namespace}/`)) {
        cleanKey = `${options.namespace}/${cleanKey}`;
      }
    }

    const contentType = options.contentType || this.guessContentType(cleanKey);
    const targetUrl = `${this.getApiBase(bucket)}/${encodeURI(cleanKey)}`;

    let bodyData: any = options.data;
    let size = 0;
    if (typeof options.data === "string") {
      const enc = new TextEncoder().encode(options.data);
      bodyData = enc;
      size = enc.byteLength;
    } else if (options.data instanceof Uint8Array) {
      size = options.data.byteLength;
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${config.r2ApiToken}`,
      "Content-Type": contentType,
    };

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

    return {
      success: true,
      key: cleanKey,
      size: returnedSize,
      etag,
      bucket,
      url: `/api/r2/raw/${encodeURIComponent(cleanKey)}?bucket=${encodeURIComponent(bucket)}`,
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
    const b = bucket || config.r2DefaultBucket || "memoryz";
    const cleanKey = key.trim().replace(/^\/+/, "");
    const targetUrl = `${this.getApiBase(b)}/${encodeURI(cleanKey)}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.r2ApiToken}`,
      },
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
    const b = bucket || config.r2DefaultBucket || "memoryz";
    const cleanKey = key.trim().replace(/^\/+/, "");
    const targetUrl = `${this.getApiBase(b)}/${encodeURI(cleanKey)}`;

    const res = await fetch(targetUrl, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${config.r2ApiToken}`,
      },
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
