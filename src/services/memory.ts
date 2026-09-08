import { getDb } from "../db/client.ts";
import { config } from "../config.ts";
import { EmbeddingService } from "./embedding.ts";

export type MemoryType = "note" | "skill" | "preference" | "env";
export type RelationType = "related" | "depends_on" | "supersedes" | "context_for";

export interface MemoryNode {
  hash: string;
  user_id: string;
  type: MemoryType;
  title: string | null;
  content: string;
  metadata: Record<string, unknown>;
  recall_count: number;
  recall_score: number;
  last_recalled_at: number | null;
  created_at: number;
  updated_at: number;
  links?: MemoryLink[];
  score?: number; // similarity or ranking score
}

export interface MemoryLink {
  source_hash: string;
  target_hash: string;
  relation_type: RelationType;
  weight: number;
  created_at: number;
  target_title?: string;
  target_type?: string;
}

export interface StoreMemoryParams {
  userId: string;
  type: MemoryType;
  content: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface RecallQueryParams {
  userId: string;
  query?: string;
  type?: MemoryType;
  limit?: number;
  threshold?: number;
}

export class MemoryService {
  /**
   * Compute SHA-256 hash for memory uniqueness
   */
  private static async computeHash(userId: string, content: string, type: string, createdAt: number): Promise<string> {
    const data = new TextEncoder().encode(`${userId}:${content}:${type}:${createdAt}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Calculate time-decayed recall score
   */
  private static calculateRecallScore(recallCount: number, lastRecalledAt: number | null, now: number): number {
    if (!lastRecalledAt || recallCount <= 0) return recallCount;
    const daysSince = Math.max(0, (now - lastRecalledAt) / (24 * 3600));
    const decay = Math.exp(-config.decayLambda * daysSince);
    return parseFloat((recallCount * decay).toFixed(4));
  }

  /**
   * Store a new memory atom with automated 768-dim embedding
   */
  static async store(params: StoreMemoryParams): Promise<MemoryNode> {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const content = params.content.trim();
    if (!content) throw new Error("Memory content cannot be empty");

    const hash = await this.computeHash(params.userId, content, params.type, now);
    const metadataStr = JSON.stringify(params.metadata || {});

    // Generate vector embedding
    const embedding = await EmbeddingService.embed(content);

    // Save to Turso using vector32 syntax for F32_BLOB column
    try {
      await db.execute({
        sql: `
          INSERT INTO memories (
            hash, user_id, type, title, content, embedding,
            metadata, recall_count, recall_score, last_recalled_at,
            is_deleted, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, vector32(?), ?, 0, 0, NULL, 0, ?, ?);
        `,
        args: [
          hash,
          params.userId,
          params.type,
          params.title || null,
          content,
          JSON.stringify(embedding),
          metadataStr,
          now,
          now,
        ],
      });
    } catch (_err) {
      // Fallback without vector32 if standard json string accepted
      await db.execute({
        sql: `
          INSERT INTO memories (
            hash, user_id, type, title, content,
            metadata, recall_count, recall_score, last_recalled_at,
            is_deleted, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL, 0, ?, ?);
        `,
        args: [
          hash,
          params.userId,
          params.type,
          params.title || null,
          content,
          metadataStr,
          now,
          now,
        ],
      });
    }

    return {
      hash,
      user_id: params.userId,
      type: params.type,
      title: params.title || null,
      content,
      metadata: params.metadata || {},
      recall_count: 0,
      recall_score: 0,
      last_recalled_at: null,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Recall memories with Semantic Search, Type Filtering, and Decay Ranking
   */
  static async recall(params: RecallQueryParams): Promise<MemoryNode[]> {
    const db = getDb();
    const limit = params.limit || 10;
    const query = params.query?.trim();
    const now = Math.floor(Date.now() / 1000);

    let rows: any[] = [];

    if (query) {
      // Step 1: Attempt native vector search on Turso
      try {
        const queryVec = await EmbeddingService.embed(query);
        let sql = `
          SELECT hash, user_id, type, title, content, metadata,
                 recall_count, recall_score, last_recalled_at, created_at, updated_at,
                 (1.0 - vector_distance_cos(embedding, vector32(?))) as sim
          FROM memories
          WHERE user_id = ? AND is_deleted = 0
        `;
        const args: any[] = [JSON.stringify(queryVec), params.userId];

        if (params.type) {
          sql += " AND type = ?";
          args.push(params.type);
        }

        sql += " ORDER BY sim DESC LIMIT ?";
        args.push(limit * 2);

        const res = await db.execute({ sql, args });
        rows = res.rows as any[];
      } catch (err) {
        console.warn("Vector search fallback to text search:", (err as Error).message);
      }

      // Step 2: If vector returned few or failed, perform text search and combine
      if (rows.length === 0) {
        let sql = `
          SELECT hash, user_id, type, title, content, metadata,
                 recall_count, recall_score, last_recalled_at, created_at, updated_at,
                 1.0 as sim
          FROM memories
          WHERE user_id = ? AND is_deleted = 0
            AND (content LIKE ? OR title LIKE ?)
        `;
        const args: any[] = [params.userId, `%${query}%`, `%${query}%`];
        if (params.type) {
          sql += " AND type = ?";
          args.push(params.type);
        }
        sql += " ORDER BY recall_score DESC, updated_at DESC LIMIT ?";
        args.push(limit);

        const res = await db.execute({ sql, args });
        rows = res.rows as any[];
      }
    } else {
      // Query-less recall: retrieve by recency & recall_score
      let sql = `
        SELECT hash, user_id, type, title, content, metadata,
               recall_count, recall_score, last_recalled_at, created_at, updated_at,
               1.0 as sim
        FROM memories
        WHERE user_id = ? AND is_deleted = 0
      `;
      const args: any[] = [params.userId];
      if (params.type) {
        sql += " AND type = ?";
        args.push(params.type);
      }
      sql += " ORDER BY recall_score DESC, updated_at DESC LIMIT ?";
      args.push(limit);

      const res = await db.execute({ sql, args });
      rows = res.rows as any[];
    }

    // Process nodes, reinforce recalled memories, fetch links
    const results: MemoryNode[] = [];

    for (const row of rows.slice(0, limit)) {
      const hash = row.hash as string;
      const count = Number(row.recall_count || 0) + 1;
      const newScore = this.calculateRecallScore(count, now, now);

      // Auto Reinforce: bump recall counter and decay score
      try {
        await db.execute({
          sql: `
            UPDATE memories
            SET recall_count = ?, recall_score = ?, last_recalled_at = ?
            WHERE hash = ?;
          `,
          args: [count, newScore, now, hash],
        });
      } catch (_e) {
        // non-blocking
      }

      // Fetch memory links
      const linksRes = await db.execute({
        sql: `
          SELECT l.source_hash, l.target_hash, l.relation_type, l.weight, l.created_at,
                 m.title as target_title, m.type as target_type
          FROM memory_links l
          LEFT JOIN memories m ON l.target_hash = m.hash
          WHERE l.source_hash = ?
          ORDER BY l.weight DESC;
        `,
        args: [hash],
      });

      let metadataObj: Record<string, unknown> = {};
      try {
        metadataObj = JSON.parse(row.metadata as string);
      } catch (_e) {
        metadataObj = {};
      }

      results.push({
        hash,
        user_id: row.user_id as string,
        type: row.type as MemoryType,
        title: row.title as string | null,
        content: row.content as string,
        metadata: metadataObj,
        recall_count: count,
        recall_score: newScore,
        last_recalled_at: now,
        created_at: Number(row.created_at),
        updated_at: Number(row.updated_at),
        score: typeof row.sim === "number" ? parseFloat(row.sim.toFixed(4)) : undefined,
        links: linksRes.rows.map((l) => ({
          source_hash: l.source_hash as string,
          target_hash: l.target_hash as string,
          relation_type: l.relation_type as RelationType,
          weight: Number(l.weight || 1.0),
          created_at: Number(l.created_at),
          target_title: l.target_title as string,
          target_type: l.target_type as string,
        })),
      });
    }

    return results;
  }

  /**
   * Link two memories together (Graph edge)
   */
  static async linkMemories(
    userId: string,
    sourceHash: string,
    targetHash: string,
    relationType: RelationType = "related",
    weight: number = 1.0
  ): Promise<boolean> {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    // Verify ownership
    const check = await db.execute({
      sql: "SELECT hash FROM memories WHERE user_id = ? AND hash IN (?, ?);",
      args: [userId, sourceHash, targetHash],
    });

    if (check.rows.length < 2) {
      throw new Error("One or both memories not found or access denied");
    }

    await db.execute({
      sql: `
        INSERT INTO memory_links (source_hash, target_hash, relation_type, weight, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(source_hash, target_hash, relation_type)
        DO UPDATE SET weight = excluded.weight;
      `,
      args: [sourceHash, targetHash, relationType, weight, now],
    });

    return true;
  }

  /**
   * Delete memory (soft delete)
   */
  static async deleteMemory(userId: string, hash: string): Promise<boolean> {
    const db = getDb();
    const res = await db.execute({
      sql: "UPDATE memories SET is_deleted = 1 WHERE user_id = ? AND hash = ?;",
      args: [userId, hash],
    });
    return res.rowsAffected > 0;
  }

  /**
   * Update memory content and title
   */
  static async updateMemory(
    userId: string,
    hash: string,
    content: string,
    title?: string,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const trimmed = content.trim();
    if (!trimmed) throw new Error("Content cannot be empty");

    const embedding = await EmbeddingService.embed(trimmed);
    const metaStr = metadata ? JSON.stringify(metadata) : undefined;

    let res;
    if (metaStr) {
      res = await db.execute({
        sql: `
          UPDATE memories
          SET content = ?, title = ?, metadata = ?, updated_at = ?
          WHERE user_id = ? AND hash = ?;
        `,
        args: [trimmed, title || null, metaStr, now, userId, hash],
      });
    } else {
      res = await db.execute({
        sql: `
          UPDATE memories
          SET content = ?, title = ?, updated_at = ?
          WHERE user_id = ? AND hash = ?;
        `,
        args: [trimmed, title || null, now, userId, hash],
      });
    }
    return res.rowsAffected > 0;
  }

  /**
   * Get all active memories for a user
   */
  static async list(userId: string, type?: MemoryType, limit: number = 50): Promise<MemoryNode[]> {
    const db = getDb();
    let sql = `
      SELECT hash, user_id, type, title, content, metadata,
             recall_count, recall_score, last_recalled_at, created_at, updated_at
      FROM memories
      WHERE user_id = ? AND is_deleted = 0
    `;
    const args: any[] = [userId];

    if (type) {
      sql += " AND type = ?";
      args.push(type);
    }
    sql += " ORDER BY updated_at DESC LIMIT ?";
    args.push(limit);

    const res = await db.execute({ sql, args });
    return res.rows.map((row) => ({
      hash: row.hash as string,
      user_id: row.user_id as string,
      type: row.type as MemoryType,
      title: row.title as string | null,
      content: row.content as string,
      metadata: JSON.parse((row.metadata as string) || "{}"),
      recall_count: Number(row.recall_count),
      recall_score: Number(row.recall_score),
      last_recalled_at: row.last_recalled_at ? Number(row.last_recalled_at) : null,
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
    }));
  }
}
