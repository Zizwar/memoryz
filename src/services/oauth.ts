import { getDb } from "../db/client.ts";
import { AuthService, User } from "./auth.ts";

export interface OAuthClient {
  clientId: string;
  clientSecret?: string;
  name?: string;
  redirectUris: string[];
  createdAt: number;
}

export interface OAuthCode {
  code: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource: string;
  exp: number;
}

export interface OAuthToken {
  token: string;
  userId: string;
  clientId: string;
  resource: string;
  type: "access" | "refresh";
  exp: number;
}

// In-memory cache + DB fallback for OAuth state
const clientsMap = new Map<string, OAuthClient>();
const codesMap = new Map<string, OAuthCode>();
const tokensMap = new Map<string, OAuthToken>();

const rand = (n = 32) => {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

async function s256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(hash);
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export class OAuthService {
  /**
   * Register dynamic OAuth client (RFC 7591)
   */
  static registerClient(redirectUris: string[], name?: string): OAuthClient {
    const clientId = "client_" + rand(16);
    const client: OAuthClient = {
      clientId,
      name: name || "Claude / Chat Client",
      redirectUris,
      createdAt: Date.now(),
    };
    clientsMap.set(clientId, client);
    return client;
  }

  static getClient(clientId: string): OAuthClient | null {
    return clientsMap.get(clientId) || null;
  }

  /**
   * Put auth code
   */
  static putCode(code: string, data: Omit<OAuthCode, "code">) {
    codesMap.set(code, { ...data, code });
  }

  /**
   * Take (consume) auth code
   */
  static takeCode(code: string): OAuthCode | null {
    const rec = codesMap.get(code);
    if (!rec) return null;
    codesMap.delete(code);
    if (Date.now() > rec.exp) return null;
    return rec;
  }

  /**
   * Issue access and refresh tokens
   */
  static issueTokens(userId: string, clientId: string, resource: string) {
    const access = "mz_at_" + rand(24);
    const refresh = "mz_rt_" + rand(24);
    const accessTtl = 3600 * 1000; // 1 hour
    const refreshTtl = 30 * 24 * 3600 * 1000; // 30 days

    tokensMap.set(access, {
      token: access,
      userId,
      clientId,
      resource,
      type: "access",
      exp: Date.now() + accessTtl,
    });

    tokensMap.set(refresh, {
      token: refresh,
      userId,
      clientId,
      resource,
      type: "refresh",
      exp: Date.now() + refreshTtl,
    });

    return {
      access_token: access,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refresh,
      scope: "mcp",
    };
  }

  /**
   * Validate token
   */
  static getToken(token: string): OAuthToken | null {
    const rec = tokensMap.get(token);
    if (!rec) return null;
    if (Date.now() > rec.exp) {
      tokensMap.delete(token);
      return null;
    }
    return rec;
  }

  /**
   * Verify PKCE S256
   */
  static async verifyPkce(verifier: string, challenge: string): Promise<boolean> {
    const computed = await s256(verifier);
    return computed === challenge;
  }
}
