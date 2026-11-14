import { getDb } from "../db/client.ts";
import { config } from "../config.ts";
import { EmbeddingService } from "./embedding.ts";
import { dispatchWebhookEvent } from "./webhook.ts";

export type MemoryType = "note" | "skill" | "preference" | "env";
export type RelationType = "related" | "depends_on" | "supersedes" | "context_for";

export interface MemoryNode {
  hash: string;
  user_id: string;
  type: MemoryType;
  title: string | null;
  content: string;
  metadata: Record<string, unknown>;
  namespace: string;
  agent_id: string | null;
  source: string | null;
  recall_count: number;
  recall_score: number;
  last_recalled_at: number | null;
  event_time: number | null;
  is_superseded: boolean;
  created_at: number;
  updated_at: number;
  links?: MemoryLink[];
  score?: number; // similarity or fused RRF ranking score
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
  namespace?: string;
  agentId?: string;
  source?: string;
  eventTime?: number | string;
  supersedesHash?: string;
  autoSupersede?: boolean;
}

export interface RecallQueryParams {
  userId: string;
  query?: string;
  type?: MemoryType;
  limit?: number;
  threshold?: number;
  format?: "full" | "compact" | "summary";
  namespace?: string;
  after?: number | string;
  before?: number | string;
  includeSuperseded?: boolean;
  expandGraph?: boolean;
  hybrid?: boolean;
}

export class MemoryService {
  /**
   * Parse Unix timestamp (seconds or ms) or ISO date string into Unix seconds
   */
  public static parseEventTime(input?: number | string | null): number | null {
    if (input === undefined || input === null || input === "") return null;
    if (typeof input === "number" && Number.isFinite(input)) {
      return input > 1e12 ? Math.floor(input / 1000) : Math.floor(input);
    }
    if (typeof input === "string") {
      const num = Number(input);
      if (Number.isFinite(num) && input.trim() !== "") {
        return num > 1e12 ? Math.floor(num / 1000) : Math.floor(num);
      }
      const parsed = Date.parse(input);
      if (!Number.isNaN(parsed)) {
        return Math.floor(parsed / 1000);
      }
    }
    return null;
  }

  /**
   * Compute deterministic SHA-256 hash for content-based deduplication
   */
  private static async computeHash(
    userId: string,
    namespace: string,
    type: string,
    content: string
  ): Promise<string> {
    const normalized = content.trim().replace(/\s+/g, " ");
    const data = new TextEncoder().encode(`${userId}:${namespace}:${type}:${normalized}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private static readonly STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
    "to", "was", "were", "will", "with", "which", "what", "where", "who", "how"
  ]);

  /**
   * Sanitize user query for SQLite FTS5 MATCH syntax
   */
  private static buildFtsQuery(query: string): string {
    const rawTokens = query
      .replace(/[^\p{L}\p{N}_-]+/gu, " ")
      .trim()
      .split(/\s+/)
      .filter((t) => t.length >= 2);
    if (rawTokens.length === 0) return "";
    const meaningful = rawTokens.filter((t) => !this.STOP_WORDS.has(t.toLowerCase()));
    const tokens = meaningful.length > 0 ? meaningful : rawTokens;
    return tokens.map((t) => `"${t.replace(/"/g, "")}"`).join(" OR ");
  }

  /**
   * Sync FTS5 index (non-blocking if FTS5 is unavailable)
   */
  private static async syncFts(
    hash: string,
    userId: string,
    namespace: string,
    title: string | null,
    content: string
  ): Promise<void> {
    const db = getDb();
    try {
      await db.execute({ sql: "DELETE FROM memories_fts WHERE hash = ?;", args: [hash] });
      await db.execute({
        sql: "INSERT INTO memories_fts (hash, user_id, namespace, title, content) VALUES (?, ?, ?, ?, ?);",
        args: [hash, userId, namespace, title || "", content],
      });
    } catch (_e) {
      // FTS5 not available on backend — ignore
    }
  }

  private static async deleteFts(hash: string): Promise<void> {
    const db = getDb();
    try {
      await db.execute({ sql: "DELETE FROM memories_fts WHERE hash = ?;", args: [hash] });
    } catch (_e) {
      // ignore
    }
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
   * Enforce Zero-Leak Policy: Reject plaintext secrets, private keys, and credentials
   */
  public static assertNoSensitiveSecrets(content: string, metadataStr?: string): void {
    const textToCheck = `${content}\n${metadataStr || ""}`;

    if (/-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/i.test(textToCheck)) {
      throw new Error(
        "🚨 [SECURITY POLICY VIOLATION] Private cryptographic key detected. Plaintext secrets are strictly forbidden in standard memories. Use 'vault_store' to encrypt credentials in the Zero-Knowledge Vault."
      );
    }

    const tokenRules: [RegExp, string][] = [
      [/\b(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{20,}\b/, "Stripe/Live API Key"],
      [/\bsk_[0-9a-zA-Z]{24,}\b/, "AI/Provider Secret Key (e.g., ElevenLabs, OpenAI)"],
      [/\bAIzaSy[0-9a-zA-Z_-]{30,}\b/, "Google Cloud/Gemini API Key"],
      [/\b(?:ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{30,}\b/, "GitHub Personal Access Token"],
      [/\b(?:npm|vck|ddp|cfat)_[0-9a-zA-Z]{20,}\b/, "Provider Access Token (NPM, Vercel, Deno, Cloudflare)"],
      [/\beyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\b/, "JWT Secret/Bearer Token"],
    ];

    for (const [pattern, label] of tokenRules) {
      if (pattern.test(textToCheck)) {
        throw new Error(
          `🚨 [SECURITY POLICY VIOLATION] ${label} detected in memory text. Standard memories are vector-indexed in plaintext. You MUST encrypt this credential using 'vault_store' and reference it only by key name (e.g., 'vault_key: <name>') or environment variable name.`
        );
      }
    }

    const passwordMatch = textToCheck.match(
      /(?:password|passphrase|secret_key|api_secret|admin_pass|vault_pass|كلمة\s*(?:المرور|السر))\s*(?:[:=]|is|هي)?\s*[:=\s]*[`'"]([^\s`'",;]{6,})[`'"]/i
    );
    if (passwordMatch) {
      const val = passwordMatch[1];
      const isPlaceholder = /^(\*+|placeholder|<[^>]+>|\$[A-Z0-9_]+|process\.env\.[A-Z0-9_]+|env\([A-Z0-9_]+\)|\{\{[^}]+\}\}|REDACTED|undefined|null)$/i.test(val);
      if (!isPlaceholder) {
        throw new Error(
          `🚨 [SECURITY ZERO-LEAK POLICY] Plaintext password/secret assignment detected. Plaintext secrets are strictly prohibited in standard memory atoms. Store credentials in the encrypted Zero-Knowledge vault via 'vault_store' and refer to them only by environment variable or vault key name.`
        );
      }
    }
  }

  /**
   * Store a new memory atom (with deduplication, bi-temporal event_time, FTS5 sync, and optional auto-supersede)
   */
  static async store(params: StoreMemoryParams): Promise<MemoryNode> {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    const content = params.content.trim();
    if (!content) throw new Error("Memory content cannot be empty");

    const metadataStr = JSON.stringify(params.metadata || {});
    this.assertNoSensitiveSecrets(content, metadataStr);

    const namespace = params.namespace?.trim() || "default";
    const hash = await this.computeHash(params.userId, namespace, params.type, content);
    const agentId = params.agentId || null;
    const source = params.source || null;
    const eventTime = this.parseEventTime(params.eventTime) ?? now;

    // Generate vector embedding (avoid polluting real vector space with fallback if API key is configured)
    const embRes = await EmbeddingService.embedWithMeta(content);
    const shouldStoreVector = !embRes.isFallback || !config.geminiApiKey;

    try {
      if (shouldStoreVector) {
        await db.execute({
          sql: `
            INSERT INTO memories (
              hash, user_id, type, title, content, embedding,
              metadata, namespace, agent_id, source, recall_count, recall_score, last_recalled_at,
              event_time, is_superseded, is_deleted, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, vector32(?), ?, ?, ?, ?, 0, 0, NULL, ?, 0, 0, ?, ?)
            ON CONFLICT(hash) DO UPDATE SET
              title = COALESCE(excluded.title, memories.title),
              metadata = excluded.metadata,
              event_time = excluded.event_time,
              is_deleted = 0,
              is_superseded = 0,
              updated_at = excluded.updated_at;
          `,
          args: [
            hash,
            params.userId,
            params.type,
            params.title || null,
            content,
            JSON.stringify(embRes.embedding),
            metadataStr,
            namespace,
            agentId,
            source,
            eventTime,
            now,
            now,
          ],
        });
      } else {
        await db.execute({
          sql: `
            INSERT INTO memories (
              hash, user_id, type, title, content,
              metadata, namespace, agent_id, source, recall_count, recall_score, last_recalled_at,
              event_time, is_superseded, is_deleted, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, 0, 0, ?, ?)
            ON CONFLICT(hash) DO UPDATE SET
              title = COALESCE(excluded.title, memories.title),
              metadata = excluded.metadata,
              event_time = excluded.event_time,
              is_deleted = 0,
              is_superseded = 0,
              updated_at = excluded.updated_at;
          `,
          args: [
            hash,
            params.userId,
            params.type,
            params.title || null,
            content,
            metadataStr,
            namespace,
            agentId,
            source,
            eventTime,
            now,
            now,
          ],
        });
      }
    } catch (_err) {
      await db.execute({
        sql: `
          INSERT INTO memories (
            hash, user_id, type, title, content,
            metadata, namespace, agent_id, source, recall_count, recall_score, last_recalled_at,
            event_time, is_superseded, is_deleted, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, 0, 0, ?, ?)
          ON CONFLICT(hash) DO UPDATE SET
            title = COALESCE(excluded.title, memories.title),
            metadata = excluded.metadata,
            event_time = excluded.event_time,
            is_deleted = 0,
            is_superseded = 0,
            updated_at = excluded.updated_at;
        `,
        args: [
          hash,
          params.userId,
          params.type,
          params.title || null,
          content,
          metadataStr,
          namespace,
          agentId,
          source,
          eventTime,
          now,
          now,
        ],
      });
    }

    // Sync FTS5 index
    await this.syncFts(hash, params.userId, namespace, params.title || null, content);

    // Explicit or automatic knowledge update (supersedes)
    if (params.supersedesHash && params.supersedesHash !== hash) {
      try {
        await this.markSuperseded(params.userId, hash, params.supersedesHash);
      } catch (_e) {
        // non-blocking
      }
    } else if (params.autoSupersede && shouldStoreVector) {
      try {
        const simRes = await db.execute({
          sql: `
            SELECT hash, (1.0 - vector_distance_cos(embedding, vector32(?))) as sim
            FROM memories
            WHERE user_id = ? AND namespace = ? AND type = ? AND is_deleted = 0 AND is_superseded = 0 AND hash != ?
            ORDER BY sim DESC
            LIMIT 3;
          `,
          args: [JSON.stringify(embRes.embedding), params.userId, namespace, params.type, hash],
        });
        for (const row of simRes.rows) {
          if (Number(row.sim || 0) >= 0.88) {
            await this.markSuperseded(params.userId, hash, row.hash as string);
          }
        }
      } catch (_e) {
        // vector_distance_cos unavailable or no match
      }
    }

    dispatchWebhookEvent({
      userId: params.userId,
      event: "memory.created",
      namespace,
      payload: {
        hash,
        type: params.type,
        title: params.title || null,
        namespace,
        agent_id: agentId,
        source,
        event_time: eventTime,
      },
    });

    return {
      hash,
      user_id: params.userId,
      type: params.type,
      title: params.title || null,
      content,
      metadata: params.metadata || {},
      namespace,
      agent_id: agentId,
      source,
      recall_count: 0,
      recall_score: 0,
      last_recalled_at: null,
      event_time: eventTime,
      is_superseded: false,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Mark an older memory as superseded by a newer memory and create a graph edge
   */
  static async markSuperseded(userId: string, newHash: string, oldHash: string): Promise<void> {
    const db = getDb();
    await this.linkMemories(userId, newHash, oldHash, "supersedes", 1.0);
    await db.execute({
      sql: "UPDATE memories SET is_superseded = 1 WHERE user_id = ? AND hash = ?;",
      args: [userId, oldHash],
    });
  }

  /**
   * Fetch memories by exact hash(es), optionally including their linked graph neighbors
   */
  static async getByHash(
    userId: string,
    hashes: string[],
    includeLinks = false
  ): Promise<MemoryNode[]> {
    const db = getDb();
    if (hashes.length === 0) return [];
    const placeholders = hashes.map(() => "?").join(",");
    const res = await db.execute({
      sql: `
        SELECT hash, user_id, type, title, content, metadata, namespace, agent_id, source,
               recall_count, recall_score, last_recalled_at, event_time, is_superseded, created_at, updated_at
        FROM memories
        WHERE user_id = ? AND is_deleted = 0 AND hash IN (${placeholders});
      `,
      args: [userId, ...hashes],
    });

    const linkMap = new Map<string, MemoryLink[]>();
    if (includeLinks && res.rows.length > 0) {
      const foundHashes = res.rows.map((r) => r.hash as string);
      const lPh = foundHashes.map(() => "?").join(",");
      const linksRes = await db.execute({
        sql: `
          SELECT l.source_hash, l.target_hash, l.relation_type, l.weight, l.created_at,
                 m.title as target_title, m.type as target_type
          FROM memory_links l
          LEFT JOIN memories m ON l.target_hash = m.hash
          WHERE l.source_hash IN (${lPh})
          ORDER BY l.weight DESC;
        `,
        args: foundHashes,
      });
      for (const l of linksRes.rows) {
        const src = l.source_hash as string;
        if (!linkMap.has(src)) linkMap.set(src, []);
        linkMap.get(src)!.push({
          source_hash: src,
          target_hash: l.target_hash as string,
          relation_type: l.relation_type as RelationType,
          weight: Number(l.weight || 1.0),
          created_at: Number(l.created_at),
          target_title: l.target_title as string,
          target_type: l.target_type as string,
        });
      }
    }

    return res.rows.map((row) => ({
      hash: row.hash as string,
      user_id: row.user_id as string,
      type: row.type as MemoryType,
      title: row.title as string | null,
      content: row.content as string,
      metadata: JSON.parse((row.metadata as string) || "{}"),
      namespace: (row.namespace as string) || "default",
      agent_id: (row.agent_id as string) || null,
      source: (row.source as string) || null,
      recall_count: Number(row.recall_count),
      recall_score: Number(row.recall_score),
      last_recalled_at: row.last_recalled_at ? Number(row.last_recalled_at) : null,
      event_time: row.event_time ? Number(row.event_time) : Number(row.created_at),
      is_superseded: Number(row.is_superseded || 0) === 1,
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
      links: includeLinks ? (linkMap.get(row.hash as string) || []) : undefined,
    }));
  }

  /**
   * Hybrid Recall: Vector Cosine + FTS5 BM25 + Reciprocal Rank Fusion (RRF) + Threshold Abstention + Supersede Filtering + Batch Reinforcement
   */
  static async recall(params: RecallQueryParams): Promise<MemoryNode[]> {
    const db = getDb();
    const limit = params.limit || 10;
    const query = params.query?.trim();
    const now = Math.floor(Date.now() / 1000);
    const threshold = params.threshold !== undefined ? params.threshold : (query ? 0.32 : 0);
    const useHybrid = params.hybrid !== false;
    const afterTs = this.parseEventTime(params.after);
    const beforeTs = this.parseEventTime(params.before);

    const buildFilters = (alias = "") => {
      const p = alias ? `${alias}.` : "";
      let clause = `${p}user_id = ? AND ${p}is_deleted = 0`;
      const args: any[] = [params.userId];
      if (!params.includeSuperseded) {
        clause += ` AND COALESCE(${p}is_superseded, 0) = 0`;
      }
      if (params.type) {
        clause += ` AND ${p}type = ?`;
        args.push(params.type);
      }
      if (params.namespace) {
        clause += ` AND ${p}namespace = ?`;
        args.push(params.namespace);
      }
      if (afterTs !== null) {
        clause += ` AND COALESCE(${p}event_time, ${p}created_at) >= ?`;
        args.push(afterTs);
      }
      if (beforeTs !== null) {
        clause += ` AND COALESCE(${p}event_time, ${p}created_at) <= ?`;
        args.push(beforeTs);
      }
      return { clause, args };
    };

    let selectedRows: any[] = [];

    if (query) {
      const candidateLimit = Math.max(limit * 3, 15);
      const vecRanks = new Map<string, { rank: number; sim: number; row: any }>();
      const ftsRanks = new Map<string, { rank: number; row: any }>();

      // 1. Native Vector Search
      try {
        const queryVec = await EmbeddingService.embed(query);
        const f = buildFilters();
        const sql = `
          SELECT hash, user_id, type, title, content, metadata, namespace, agent_id, source,
                 recall_count, recall_score, last_recalled_at, event_time, is_superseded, created_at, updated_at,
                 (1.0 - vector_distance_cos(embedding, vector32(?))) as sim
          FROM memories
          WHERE ${f.clause} AND embedding IS NOT NULL
          ORDER BY sim DESC LIMIT ?;
        `;
        const res = await db.execute({ sql, args: [JSON.stringify(queryVec), ...f.args, candidateLimit] });
        res.rows.forEach((row: any, idx: number) => {
          vecRanks.set(row.hash as string, { rank: idx + 1, sim: Number(row.sim || 0), row });
        });
      } catch (err) {
        console.warn("Vector search fallback:", (err as Error).message);
      }

      // 2. Hybrid FTS5 BM25 Search (with LIKE fallback)
      if (useHybrid) {
        const ftsQuery = this.buildFtsQuery(query);
        let ftsSuccess = false;
        if (ftsQuery) {
          try {
            const f = buildFilters("m");
            const sql = `
              SELECT m.hash, m.user_id, m.type, m.title, m.content, m.metadata, m.namespace, m.agent_id, m.source,
                     m.recall_count, m.recall_score, m.last_recalled_at, m.event_time, m.is_superseded, m.created_at, m.updated_at,
                     bm25(memories_fts) as bm25_score
              FROM memories_fts f
              JOIN memories m ON f.hash = m.hash
              WHERE memories_fts MATCH ? AND ${f.clause}
              ORDER BY bm25_score ASC LIMIT ?;
            `;
            const res = await db.execute({ sql, args: [ftsQuery, ...f.args, candidateLimit] });
            res.rows.forEach((row: any, idx: number) => {
              ftsRanks.set(row.hash as string, { rank: idx + 1, row });
            });
            ftsSuccess = true;
          } catch (_e) {
            ftsSuccess = false;
          }
        }

        if (!ftsSuccess) {
          try {
            const f = buildFilters();
            const sql = `
              SELECT hash, user_id, type, title, content, metadata, namespace, agent_id, source,
                     recall_count, recall_score, last_recalled_at, event_time, is_superseded, created_at, updated_at
              FROM memories
              WHERE ${f.clause} AND (content LIKE ? OR title LIKE ?)
              ORDER BY recall_score DESC, updated_at DESC LIMIT ?;
            `;
            const res = await db.execute({ sql, args: [...f.args, `%${query}%`, `%${query}%`, candidateLimit] });
            res.rows.forEach((row: any, idx: number) => {
              ftsRanks.set(row.hash as string, { rank: idx + 1, row });
            });
          } catch (_e) {
            // ignore
          }
        }
      }

      // 3. Reciprocal Rank Fusion (RRF) + Threshold Abstention + Recall Score Boost
      const allHashes = new Set<string>([...vecRanks.keys(), ...ftsRanks.keys()]);
      const rrfK = 60;
      const scored: Array<{ row: any; fusedScore: number; sim: number }> = [];

      for (const h of allHashes) {
        const v = vecRanks.get(h);
        const f = ftsRanks.get(h);
        const row = v?.row || f?.row;
        const sim = v ? v.sim : 0;

        // Abstention gate: drop weak vector-only matches below threshold
        if (!f && threshold > 0 && sim < threshold) {
          continue;
        }

        let rrf = 0;
        if (v) rrf += 1 / (rrfK + v.rank);
        if (f) rrf += 1 / (rrfK + f.rank);
        const recallBoost = Math.log1p(Math.max(0, Number(row.recall_score || 0))) * 0.002;
        const fusedScore = rrf + recallBoost;

        scored.push({ row, fusedScore, sim: v ? sim : 0.75 });
      }

      scored.sort((a, b) => b.fusedScore - a.fusedScore);
      selectedRows = scored.slice(0, limit).map((item) => ({
        ...item.row,
        sim: item.sim,
        fusedScore: item.fusedScore,
      }));
    } else {
      // Query-less recall: retrieve by recency & recall_score
      const f = buildFilters();
      const sql = `
        SELECT hash, user_id, type, title, content, metadata, namespace, agent_id, source,
               recall_count, recall_score, last_recalled_at, event_time, is_superseded, created_at, updated_at,
               1.0 as sim
        FROM memories
        WHERE ${f.clause}
        ORDER BY recall_score DESC, COALESCE(event_time, created_at) DESC LIMIT ?;
      `;
      const res = await db.execute({ sql, args: [...f.args, limit] });
      selectedRows = res.rows as any[];
    }

    if (selectedRows.length === 0) return [];

    // 4. Batch Update Reinforcement (Eliminates N+1 Sequential Writes)
    const selectedHashes = selectedRows.map((r) => r.hash as string);
    const placeholders = selectedHashes.map(() => "?").join(",");
    try {
      await db.execute({
        sql: `
          UPDATE memories
          SET recall_count = recall_count + 1,
              recall_score = recall_count + 1,
              last_recalled_at = ?
          WHERE user_id = ? AND hash IN (${placeholders});
        `,
        args: [now, params.userId, ...selectedHashes],
      });
    } catch (_e) {
      // non-blocking
    }

    // 5. Batch Fetch Links (Eliminates N+1 Sequential Reads)
    const linksBySource = new Map<string, MemoryLink[]>();
    try {
      const linksRes = await db.execute({
        sql: `
          SELECT l.source_hash, l.target_hash, l.relation_type, l.weight, l.created_at,
                 m.title as target_title, m.type as target_type
          FROM memory_links l
          LEFT JOIN memories m ON l.target_hash = m.hash
          WHERE l.source_hash IN (${placeholders})
          ORDER BY l.weight DESC;
        `,
        args: selectedHashes,
      });
      for (const l of linksRes.rows) {
        const src = l.source_hash as string;
        if (!linksBySource.has(src)) linksBySource.set(src, []);
        linksBySource.get(src)!.push({
          source_hash: src,
          target_hash: l.target_hash as string,
          relation_type: l.relation_type as RelationType,
          weight: Number(l.weight || 1.0),
          created_at: Number(l.created_at),
          target_title: l.target_title as string,
          target_type: l.target_type as string,
        });
      }
    } catch (_e) {
      // non-blocking
    }

    const results: MemoryNode[] = selectedRows.map((row) => {
      const hash = row.hash as string;
      const count = Number(row.recall_count || 0) + 1;
      const newScore = this.calculateRecallScore(count, now, now);

      let metadataObj: Record<string, unknown> = {};
      try {
        metadataObj = JSON.parse(row.metadata as string);
      } catch (_e) {
        metadataObj = {};
      }

      return {
        hash,
        user_id: row.user_id as string,
        type: row.type as MemoryType,
        title: row.title as string | null,
        content: row.content as string,
        metadata: metadataObj,
        namespace: (row.namespace as string) || "default",
        agent_id: (row.agent_id as string) || null,
        source: (row.source as string) || null,
        recall_count: count,
        recall_score: newScore,
        last_recalled_at: now,
        event_time: row.event_time ? Number(row.event_time) : Number(row.created_at),
        is_superseded: Number(row.is_superseded || 0) === 1,
        created_at: Number(row.created_at),
        updated_at: Number(row.updated_at),
        score: typeof row.sim === "number" ? parseFloat(row.sim.toFixed(4)) : undefined,
        links: linksBySource.get(hash) || [],
      };
    });

    // 6. Optional 1-Hop Graph Expansion for Multi-Hop Context
    if (params.expandGraph !== false && results.length < limit) {
      const existingSet = new Set(selectedHashes);
      const neighborHashes: string[] = [];
      for (const node of results) {
        for (const link of node.links || []) {
          if (
            (link.relation_type === "depends_on" || link.relation_type === "context_for" || link.relation_type === "related") &&
            !existingSet.has(link.target_hash)
          ) {
            existingSet.add(link.target_hash);
            neighborHashes.push(link.target_hash);
          }
        }
      }
      if (neighborHashes.length > 0) {
        const remaining = limit - results.length;
        const neighbors = await this.getByHash(params.userId, neighborHashes.slice(0, remaining), false);
        for (const n of neighbors) {
          if (!n.is_superseded) results.push(n);
        }
      }
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

    if (relationType === "supersedes") {
      await db.execute({
        sql: "UPDATE memories SET is_superseded = 1 WHERE user_id = ? AND hash = ?;",
        args: [userId, targetHash],
      });
    }

    return true;
  }

  /**
   * Fetch memory knowledge graph (nodes + edges) for user
   */
  static async getGraph(userId: string, namespace?: string): Promise<{
    nodes: Array<{
      id: string;
      label: string;
      title: string;
      type: MemoryType;
      content: string;
      namespace: string;
      recall_count: number;
      recall_score: number;
      created_at: number;
    }>;
    edges: Array<{
      id: string;
      from: string;
      to: string;
      label: string;
      relation: RelationType;
      weight: number;
    }>;
    stats: {
      totalNodes: number;
      totalEdges: number;
    };
  }> {
    const db = getDb();
    let sqlMem = `
      SELECT hash, type, title, content, namespace, recall_count, recall_score, created_at
      FROM memories
      WHERE user_id = ? AND is_deleted = 0
    `;
    const argsMem: any[] = [userId];
    if (namespace && namespace !== "all") {
      sqlMem += " AND namespace = ?";
      argsMem.push(namespace);
    }
    sqlMem += " ORDER BY created_at DESC LIMIT 300;";

    const resMem = await db.execute({ sql: sqlMem, args: argsMem });

    const nodes = resMem.rows.map((r) => {
      const hash = r.hash as string;
      const title = (r.title as string) || (r.content as string).substring(0, 30);
      return {
        id: hash,
        label: title.length > 25 ? title.substring(0, 25) + "..." : title,
        title: (r.content as string).substring(0, 300),
        type: r.type as MemoryType,
        content: r.content as string,
        namespace: (r.namespace as string) || "default",
        recall_count: Number(r.recall_count || 0),
        recall_score: Number(r.recall_score || 0),
        created_at: Number(r.created_at || 0),
      };
    });

    if (nodes.length === 0) {
      return { nodes: [], edges: [], stats: { totalNodes: 0, totalEdges: 0 } };
    }

    const nodeIds = nodes.map((n) => n.id);
    const placeholders = nodeIds.map(() => "?").join(",");
    const resLinks = await db.execute({
      sql: `
        SELECT source_hash, target_hash, relation_type, weight
        FROM memory_links
        WHERE source_hash IN (${placeholders}) AND target_hash IN (${placeholders});
      `,
      args: [...nodeIds, ...nodeIds],
    });

    const edges = resLinks.rows.map((l, idx) => ({
      id: `edge_${idx}_${l.source_hash}_${l.target_hash}`,
      from: l.source_hash as string,
      to: l.target_hash as string,
      label: l.relation_type as string,
      relation: l.relation_type as RelationType,
      weight: Number(l.weight || 1.0),
    }));

    return {
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    };
  }

  /**
   * Remove a graph link between two memories
   */
  static async unlinkMemories(
    userId: string,
    sourceHash: string,
    targetHash: string,
    relationType?: string
  ): Promise<boolean> {
    const db = getDb();

    const check = await db.execute({
      sql: "SELECT hash FROM memories WHERE user_id = ? AND hash IN (?, ?);",
      args: [userId, sourceHash, targetHash],
    });
    if (check.rows.length < 2) {
      return false;
    }

    let sql = "DELETE FROM memory_links WHERE source_hash = ? AND target_hash = ?";
    const args: any[] = [sourceHash, targetHash];
    if (relationType) {
      sql += " AND relation_type = ?";
      args.push(relationType);
    }
    const res = await db.execute({ sql, args });
    return res.rowsAffected > 0;
  }

  /**
   * Delete memory (soft delete + remove from FTS5)
   */
  static async deleteMemory(userId: string, hash: string): Promise<boolean> {
    const db = getDb();
    const res = await db.execute({
      sql: "UPDATE memories SET is_deleted = 1 WHERE user_id = ? AND hash = ?;",
      args: [userId, hash],
    });
    if (res.rowsAffected > 0) {
      await this.deleteFts(hash);
    }
    return res.rowsAffected > 0;
  }

  /**
   * Update memory content and title (re-embeds and updates FTS5)
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

    const metaStr = metadata ? JSON.stringify(metadata) : undefined;
    this.assertNoSensitiveSecrets(trimmed, metaStr);

    const embRes = await EmbeddingService.embedWithMeta(trimmed);
    const shouldStoreVector = !embRes.isFallback || !config.geminiApiKey;
    const embStr = JSON.stringify(embRes.embedding);

    let res;
    try {
      if (shouldStoreVector) {
        if (metaStr) {
          res = await db.execute({
            sql: `
              UPDATE memories
              SET content = ?, title = ?, metadata = ?, embedding = vector32(?), updated_at = ?
              WHERE user_id = ? AND hash = ?;
            `,
            args: [trimmed, title || null, metaStr, embStr, now, userId, hash],
          });
        } else {
          res = await db.execute({
            sql: `
              UPDATE memories
              SET content = ?, title = ?, embedding = vector32(?), updated_at = ?
              WHERE user_id = ? AND hash = ?;
            `,
            args: [trimmed, title || null, embStr, now, userId, hash],
          });
        }
      } else {
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
      }
    } catch (_err) {
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
    }

    if (res.rowsAffected > 0) {
      await this.syncFts(hash, userId, "default", title || null, trimmed);
    }
    return res.rowsAffected > 0;
  }

  /**
   * Get all active memories for a user
   */
  static async list(userId: string, type?: MemoryType, limit: number = 50, namespace?: string): Promise<MemoryNode[]> {
    const db = getDb();
    let sql = `
      SELECT hash, user_id, type, title, content, metadata, namespace, agent_id, source,
             recall_count, recall_score, last_recalled_at, event_time, is_superseded, created_at, updated_at
      FROM memories
      WHERE user_id = ? AND is_deleted = 0 AND COALESCE(is_superseded, 0) = 0
    `;
    const args: any[] = [userId];

    if (type) {
      sql += " AND type = ?";
      args.push(type);
    }
    if (namespace) {
      sql += " AND namespace = ?";
      args.push(namespace);
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
      namespace: (row.namespace as string) || "default",
      agent_id: (row.agent_id as string) || null,
      source: (row.source as string) || null,
      recall_count: Number(row.recall_count),
      recall_score: Number(row.recall_score),
      last_recalled_at: row.last_recalled_at ? Number(row.last_recalled_at) : null,
      event_time: row.event_time ? Number(row.event_time) : Number(row.created_at),
      is_superseded: Number(row.is_superseded || 0) === 1,
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
    }));
  }

  /**
   * Format memories into compact single-line strings to minimize token usage
   */
  static formatCompact(memories: MemoryNode[]): string {
    return memories
      .map((m, idx) => {
        const title = m.title ? `"${m.title}"` : m.hash.substring(0, 8);
        return `#${idx + 1} [${m.type.toUpperCase()}] ${title}: ${m.content.trim().replace(/\s+/g, " ")}`;
      })
      .join("\n");
  }

  /**
   * Format memories into bullet points for agent prompts
   */
  static formatSummary(memories: MemoryNode[]): string {
    return memories
      .map((m) => `• [${m.type.toUpperCase()}] ${m.title ? m.title + ": " : ""}${m.content.trim()}`)
      .join("\n");
  }
}
