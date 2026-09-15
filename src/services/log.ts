import { getDb } from "../db/client.ts";

export type LogLevel = "info" | "warn" | "error" | "debug" | "trace";

export interface LogItem {
  id: string;
  user_id: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: number;
}

export interface AppendLogParams {
  userId: string;
  message: string;
  level?: LogLevel;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface ListLogsFilter {
  level?: LogLevel;
  source?: string;
  limit?: number;
  since?: number;
}

export class LogService {
  private static generateLogId(): string {
    return `log_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * Append an ephemeral log entry without embedding overhead
   */
  static async append(params: AppendLogParams): Promise<LogItem> {
    const db = getDb();
    const id = this.generateLogId();
    const now = Math.floor(Date.now() / 1000);
    const message = params.message.trim();
    if (!message) throw new Error("Log message cannot be empty");

    const level = params.level || "info";
    const source = (params.source || "agent").trim();
    const metadataStr = JSON.stringify(params.metadata || {});

    await db.execute({
      sql: `
        INSERT INTO logs (id, user_id, level, source, message, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      args: [id, params.userId, level, source, message, metadataStr, now],
    });

    return {
      id,
      user_id: params.userId,
      level,
      source,
      message,
      metadata: params.metadata || {},
      created_at: now,
    };
  }

  /**
   * List recent logs with filters
   */
  static async list(userId: string, filter: ListLogsFilter = {}): Promise<LogItem[]> {
    const db = getDb();
    let sql = "SELECT * FROM logs WHERE user_id = ?";
    const args: any[] = [userId];

    if (filter.level) {
      sql += " AND level = ?";
      args.push(filter.level);
    }

    if (filter.source) {
      sql += " AND source = ?";
      args.push(filter.source);
    }

    if (filter.since) {
      sql += " AND created_at >= ?";
      args.push(filter.since);
    }

    sql += " ORDER BY created_at DESC LIMIT ?";
    args.push(filter.limit || 50);

    const res = await db.execute({ sql, args });
    return res.rows.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      level: row.level as LogLevel,
      source: row.source as string,
      message: row.message as string,
      metadata: JSON.parse((row.metadata as string) || "{}"),
      created_at: Number(row.created_at),
    }));
  }

  /**
   * Format logs into compact one-line strings for AI consumption
   */
  static formatCompact(logs: LogItem[]): string {
    return logs
      .map((l) => {
        const time = new Date(l.created_at * 1000).toISOString().replace("T", " ").substring(11, 19);
        return `[${time}] [${l.level.toUpperCase()}] [${l.source}]: ${l.message}`;
      })
      .join("\n");
  }

  /**
   * Clear older logs
   */
  static async clear(userId: string, beforeTimestamp?: number): Promise<number> {
    const db = getDb();
    let sql = "DELETE FROM logs WHERE user_id = ?";
    const args: any[] = [userId];
    if (beforeTimestamp) {
      sql += " AND created_at < ?";
      args.push(beforeTimestamp);
    }
    const res = await db.execute({ sql, args });
    return res.rowsAffected;
  }
}
