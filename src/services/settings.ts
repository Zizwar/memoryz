import { getDb } from "../db/client.ts";

export class SettingsService {
  static async get(key: string, defaultValue = ""): Promise<string> {
    try {
      const db = getDb();
      const res = await db.execute({
        sql: "SELECT value FROM app_settings WHERE key = ?",
        args: [key],
      });
      if (res.rows.length > 0 && res.rows[0].value !== null) {
        return String(res.rows[0].value);
      }
    } catch (e) {
      console.warn(`[SettingsService] Failed to get ${key}:`, (e as Error).message);
    }
    return defaultValue;
  }

  static async set(key: string, value: string): Promise<void> {
    const db = getDb();
    const now = Date.now();
    await db.execute({
      sql: `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `,
      args: [key, value, now],
    });
  }

  static async isJevEnabled(): Promise<boolean> {
    if (Deno.env.get("JEV_DISABLED") === "true" || Deno.env.get("DISABLE_JEV") === "true") {
      return false;
    }
    const val = await this.get("jev_enabled", "false");
    return val === "true" || val === "1";
  }

  static async setJevEnabled(enabled: boolean): Promise<void> {
    await this.set("jev_enabled", enabled ? "true" : "false");
  }
}
