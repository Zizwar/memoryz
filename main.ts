import { config } from "./src/config.ts";
import { initDb } from "./src/db/schema.ts";
import { handleApiRoute } from "./src/routes/api.ts";
import { handleMcpRoute } from "./src/routes/mcp.ts";
import { generateOpenApiSpec } from "./src/routes/openapi.ts";
import { renderAppHtml } from "./src/ui/html.ts";

// Initialize database schema on startup
try {
  await initDb();
} catch (err) {
  console.error("DB Initialization error:", err);
}

console.log(`
  __  __                                 _____ 
 |  \\/  |                               |___  /
 | \\  / | ___ _ __ ___   ___  _ __ _   _   / / 
 | |\\/| |/ _ \\ '_ \` _ \\ / _ \\| '__| | | | / /  
 | |  | |  __/ | | | | | (_) | |  | |_| |/ /__ 
 |_|  |_|\\___|_| |_| |_|\\___/|_|   \\__, /_____|
                                    __/ |      
   Sovereign Living Memory Substrate |___/       
`);

Deno.serve({ port: config.port }, async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Root Web Application
  if (path === "/" || path === "/index.html") {
    return new Response(renderAppHtml(), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // OpenAPI 3.1 & Swagger schema for Mobile Chat Connectors (ChatGPT / LibreChat / Actions)
  if (path === "/openapi.json" || path === "/swagger.json") {
    const token =
      url.searchParams.get("token") ||
      url.searchParams.get("key") ||
      url.searchParams.get("api_key") ||
      "";
    const spec = generateOpenApiSpec(url.origin, token);
    return new Response(JSON.stringify(spec, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Remote MCP Connector & SSE & OAuth Discovery & OAuth 2.1 routes
  if (
    path.startsWith("/mcp") ||
    path === "/api/mcp" ||
    path.startsWith("/api/mcp/") ||
    path === "/sse" ||
    path.startsWith("/.well-known/") ||
    path.startsWith("/oauth")
  ) {
    return await handleMcpRoute(req, url);
  }

  // REST API routes
  if (path.startsWith("/api/")) {
    return await handleApiRoute(req, url);
  }

  return new Response("Not Found", { status: 404 });
});
