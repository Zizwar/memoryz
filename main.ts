import { config } from "./src/config.ts";
import { initDb } from "./src/db/schema.ts";
import { handleApiRoute } from "./src/routes/api.ts";
import { handleMcpRoute } from "./src/routes/mcp.ts";
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

  // Static root -> Web Application & Dashboard
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response(renderAppHtml(), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // REST API routes
  if (url.pathname.startsWith("/api/")) {
    return await handleApiRoute(req, url);
  }

  // MCP protocol routes
  if (url.pathname.startsWith("/mcp")) {
    return await handleMcpRoute(req, url);
  }

  return new Response("Not Found", { status: 404 });
});
