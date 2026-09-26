// MemoryZ Configuration Loader

// Helper to load .env file if running locally
async function loadDotEnv() {
  try {
    const content = await Deno.readTextFile(".env");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (!Deno.env.get(key)) {
          Deno.env.set(key, value);
        }
      }
    }
  } catch (_e) {
    // .env might not exist in production / cloud deploy, fallback to system env
  }
}

await loadDotEnv();

export const config = {
  // Turso
  tursoUrl: Deno.env.get("TURSO_DATABASE_URL") || Deno.env.get("turso_url") || "",
  tursoAuthToken: Deno.env.get("TURSO_AUTH_TOKEN") || Deno.env.get("turso_key") || "",

  // Gemini API
  geminiApiKey: Deno.env.get("GEMINI_API_KEY") || Deno.env.get("gemini_key") || "",

  // Vercel AI Gateway & TypeSafe Jev
  vercelAiKey: Deno.env.get("VERCEL_AI_KEY") || "",
  jevAiKey: Deno.env.get("JEV_AI_KEY") || "",

  // Deno Deploy
  denoDeployToken: Deno.env.get("DENO_DEPLOY_TOKEN") || Deno.env.get("key_deno_zizwar") || "",
  denoOrg: Deno.env.get("DENO_ORG") || "wino",
  denoApp: Deno.env.get("DENO_APP") || "memoryz",

  // Server
  port: parseInt(Deno.env.get("PORT") || "8000", 10),
  jwtSecret: Deno.env.get("JWT_SECRET") || "memoryz_secret_default_change_in_prod",
  environment: Deno.env.get("ENVIRONMENT") || "production",

  // Embedding Dimension
  embeddingDim: 768,
  // Time Decay Parameter (lambda ~ 0.05 gives ~14-day half-life)
  decayLambda: 0.05,

  // Cloudflare R2 Storage Substrate
  r2AccountId: Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || Deno.env.get("R2_ACCOUNT_ID") || "2b9e37321a07ea1c1452c3a1985b6347",
  r2ApiToken: Deno.env.get("CLOUDFLARE_R2_TOKEN_VALUE") || Deno.env.get("R2_API_TOKEN") || "",
  r2DefaultBucket: Deno.env.get("CLOUDFLARE_R2_BUCKET") || Deno.env.get("R2_BUCKET") || "memoryz",
};
