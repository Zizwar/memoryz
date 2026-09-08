import { createClient, Client } from "npm:@libsql/client/web";
import { config } from "../config.ts";

let _client: Client | null = null;

export function getDb(): Client {
  if (!_client) {
    if (!config.tursoUrl) {
      throw new Error("Missing TURSO_DATABASE_URL or turso_url in configuration");
    }
    _client = createClient({
      url: config.tursoUrl,
      authToken: config.tursoAuthToken || undefined,
    });
  }
  return _client;
}
