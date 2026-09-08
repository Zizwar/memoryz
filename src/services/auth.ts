import { getDb } from "../db/client.ts";
import { config } from "../config.ts";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  api_key: string;
  created_at: number;
}

export interface AuthSession {
  user: User;
  token: string;
}

export class AuthService {
  // Utility: Hash password using SHA-256 with salt
  private static async hashPassword(password: string, salt: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(`${salt}:${password}:memoryz_salt_2026`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Create JWT token using HMAC-SHA256
  static async createToken(userId: string, role: string): Promise<string> {
    const enc = new TextEncoder();
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 30 * 24 * 3600; // 30 days
    const payload = btoa(JSON.stringify({ sub: userId, role, iat: now, exp }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(config.jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(`${header}.${payload}`)
    );
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    return `${header}.${payload}.${signature}`;
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<{ sub: string; role: string } | null> {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;

      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(config.jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const signBytes = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
        c.charCodeAt(0)
      );

      const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        signBytes,
        enc.encode(`${header}.${payload}`)
      );
      if (!valid) return null;

      const decodedPayload = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );
      const now = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp && decodedPayload.exp < now) return null;

      return { sub: decodedPayload.sub, role: decodedPayload.role };
    } catch (_e) {
      return null;
    }
  }

  // Generate random API key
  private static generateApiKey(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return "mz_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Register a new user
   */
  static async register(username: string, email: string, password: string): Promise<AuthSession> {
    const db = getDb();
    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUser || cleanUser.length < 3) throw new Error("Username must be at least 3 characters");
    if (!cleanEmail.includes("@")) throw new Error("Invalid email address");
    if (!password || password.length < 6) throw new Error("Password must be at least 6 characters");

    // Check if user or email exists
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1;",
      args: [cleanUser, cleanEmail],
    });
    if (existing.rows.length > 0) {
      throw new Error("Username or email already registered");
    }

    // Check total users count to assign 'admin' to the first user
    const countRes = await db.execute("SELECT COUNT(*) as count FROM users;");
    const count = Number(countRes.rows[0]?.count || 0);
    const role = count === 0 ? "admin" : "user";

    const id = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const passwordHash = `${salt}:${await this.hashPassword(password, salt)}`;
    const apiKey = this.generateApiKey();
    const now = Math.floor(Date.now() / 1000);

    await db.execute({
      sql: `
        INSERT INTO users (id, username, email, password_hash, role, api_key, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [id, cleanUser, cleanEmail, passwordHash, role, apiKey, now, now],
    });

    const user: User = { id, username: cleanUser, email: cleanEmail, role, api_key: apiKey, created_at: now };
    const token = await this.createToken(id, role);

    return { user, token };
  }

  /**
   * User login
   */
  static async login(identifier: string, password: string): Promise<AuthSession> {
    const db = getDb();
    const clean = identifier.trim().toLowerCase();

    const res = await db.execute({
      sql: "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1;",
      args: [clean, clean],
    });

    if (res.rows.length === 0) {
      throw new Error("Invalid credentials");
    }

    const row = res.rows[0];
    const stored = row.password_hash as string;
    const [salt, hash] = stored.split(":");
    const testHash = await this.hashPassword(password, salt);

    if (testHash !== hash) {
      throw new Error("Invalid credentials");
    }

    const user: User = {
      id: row.id as string,
      username: row.username as string,
      email: row.email as string,
      role: row.role as "user" | "admin",
      api_key: row.api_key as string,
      created_at: Number(row.created_at),
    };

    const token = await this.createToken(user.id, user.role);
    return { user, token };
  }

  /**
   * Find user by API key (used for MCP, CLI, Agents)
   */
  static async findByApiKey(apiKey: string): Promise<User | null> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM users WHERE api_key = ? LIMIT 1;",
      args: [apiKey.trim()],
    });

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id as string,
      username: row.username as string,
      email: row.email as string,
      role: row.role as "user" | "admin",
      api_key: row.api_key as string,
      created_at: Number(row.created_at),
    };
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const db = getDb();
    const res = await db.execute({
      sql: "SELECT * FROM users WHERE id = ? LIMIT 1;",
      args: [id],
    });

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id as string,
      username: row.username as string,
      email: row.email as string,
      role: row.role as "user" | "admin",
      api_key: row.api_key as string,
      created_at: Number(row.created_at),
    };
  }

  /**
   * Platform Analytics for Admin Dashboard
   */
  static async getPlatformStats(): Promise<Record<string, any>> {
    const db = getDb();

    const [userCount, memoryCount, typesBreakdown, topRecalled, vaultCount] = await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM users;"),
      db.execute("SELECT COUNT(*) as count FROM memories WHERE is_deleted = 0;"),
      db.execute(`
        SELECT type, COUNT(*) as count 
        FROM memories 
        WHERE is_deleted = 0 
        GROUP BY type;
      `),
      db.execute(`
        SELECT title, type, recall_count, recall_score, updated_at 
        FROM memories 
        WHERE is_deleted = 0 
        ORDER BY recall_count DESC, recall_score DESC 
        LIMIT 6;
      `),
      db.execute("SELECT COUNT(*) as count FROM vault_entries;"),
    ]);

    const usersList = await db.execute(`
      SELECT id, username, email, role, created_at,
             (SELECT COUNT(*) FROM memories WHERE user_id = users.id AND is_deleted = 0) as memory_count
      FROM users
      ORDER BY created_at DESC
      LIMIT 20;
    `);

    return {
      totalUsers: Number(userCount.rows[0]?.count || 0),
      totalMemories: Number(memoryCount.rows[0]?.count || 0),
      totalVaultSecrets: Number(vaultCount.rows[0]?.count || 0),
      types: typesBreakdown.rows,
      topRecalled: topRecalled.rows,
      users: usersList.rows,
    };
  }
}
