import { McpServer, MCP_TOOLS } from "../mcp/server.ts";
import { AuthService, User } from "../services/auth.ts";

export async function handleMcpRoute(req: Request, url: URL): Promise<Response> {
  const origin = url.origin;
  const path = url.pathname;

  // Global CORS Headers for all MCP and Connector clients
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, mcp-session-id, Last-Event-ID",
    "Access-Control-Expose-Headers": "mcp-session-id, Content-Type",
  };

  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // RFC 9728 & OAuth discovery endpoints (matches wmam pattern for Claude/ChatGPT mobile)
  if (path.startsWith("/.well-known/oauth-protected-resource")) {
    return new Response(
      JSON.stringify({
        resource: `${origin}/mcp`,
        authorization_servers: [origin],
        scopes_supported: ["mcp", "memory:read", "memory:write", "vault"],
        bearer_methods_supported: ["header", "query"],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  if (path === "/.well-known/oauth-authorization-server") {
    return new Response(
      JSON.stringify({
        issuer: origin,
        authorization_endpoint: `${origin}/oauth/authorize`,
        token_endpoint: `${origin}/oauth/token`,
        response_types_supported: ["token", "code"],
        grant_types_supported: ["authorization_code", "client_credentials"],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  // Extract Token / API Key from all possible header and query formats:
  // Supports: Authorization: Bearer, X-API-Key, ?token=, ?key=, ?apiKey=, ?api_key=, ?mcp_key=
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("X-API-Key");
  const queryToken =
    url.searchParams.get("token") ||
    url.searchParams.get("key") ||
    url.searchParams.get("apiKey") ||
    url.searchParams.get("api_key") ||
    url.searchParams.get("mcp_key");

  let token: string | null = null;
  if (apiKeyHeader) {
    token = apiKeyHeader.trim();
  } else if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (authHeader?.startsWith("Key ")) {
    token = authHeader.substring(4).trim();
  } else if (queryToken) {
    token = queryToken.trim();
  }

  // Authenticate User
  let currentUser: User | null = null;
  if (token) {
    // 1. Try finding by API Key (mz_...)
    currentUser = await AuthService.findByApiKey(token);
    // 2. Try verifying as JWT session token
    if (!currentUser) {
      const decoded = await AuthService.verifyToken(token);
      if (decoded) {
        currentUser = await AuthService.findById(decoded.sub);
      }
    }
  }

  // Fallback: If no token provided on a discovery GET request, return public server manifest
  if (!currentUser && req.method === "GET" && !req.headers.get("Accept")?.includes("text/event-stream")) {
    return new Response(
      JSON.stringify({
        name: "MemoryZ MCP Server",
        description: "Sovereign Living Memory Substrate — Single URL Connector",
        status: "online",
        transport: "Streamable HTTP & SSE",
        auth_required: true,
        connect_url_template: `${origin}/mcp?token=YOUR_API_KEY`,
        openapi_url_template: `${origin}/openapi.json?token=YOUR_API_KEY`,
        tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
      }, null, 2),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  // If action requires authentication and no valid user found
  if (!currentUser) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Unauthorized: Valid MemoryZ token or API key required. Add ?token=<YOUR_KEY> to the URL or provide Authorization header.",
        },
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Handle SSE (Server-Sent Events) Stream for Remote Mobile Clients
  const acceptsSse = req.headers.get("Accept")?.includes("text/event-stream");
  const isSsePath = path === "/sse" || path === "/mcp/sse" || path === "/api/mcp/sse";
  const wantsSse = url.searchParams.get("transport") === "sse";

  if (req.method === "GET" && (acceptsSse || isSsePath || wantsSse)) {
    const sessionId = req.headers.get("mcp-session-id") || crypto.randomUUID();
    const enc = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial endpoint event as required by MCP SSE transport specification
        controller.enqueue(
          enc.encode(`event: endpoint\ndata: ${origin}/mcp?token=${token}&session_id=${sessionId}\n\n`)
        );

        // Keep-alive heartbeat comment
        const timer = setInterval(() => {
          try {
            controller.enqueue(enc.encode(`: ping\n\n`));
          } catch (_e) {
            clearInterval(timer);
          }
        }, 15000);
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "mcp-session-id": sessionId,
      },
    });
  }

  // Standard GET on /mcp with authenticated user -> Return connector details + status
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        name: "MemoryZ MCP Server",
        user: currentUser.username,
        status: "ready",
        transport: "Streamable HTTP & SSE",
        endpoint: `${origin}/mcp?token=${token}`,
        tools: MCP_TOOLS,
      }, null, 2),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  // POST: MCP JSON-RPC 2.0 Request Handling (Streamable HTTP)
  if (req.method === "POST") {
    const sessionId = req.headers.get("mcp-session-id") || url.searchParams.get("session_id") || crypto.randomUUID();
    try {
      const rpcReq = await req.json();
      const rpcRes = await McpServer.handleRpc(currentUser.id, rpcReq);

      return new Response(JSON.stringify(rpcRes), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "mcp-session-id": sessionId,
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error: " + (err as Error).message },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // DELETE: Session close
  if (req.method === "DELETE") {
    return new Response(JSON.stringify({ status: "session_closed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
}
