import { McpServer } from "../mcp/server.ts";
import { AuthService } from "../services/auth.ts";

export async function handleMcpRoute(req: Request, url: URL): Promise<Response> {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      },
    });
  }

  // Resolve API Key
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("X-API-Key");
  const urlApiKey = url.searchParams.get("api_key");

  let apiKey: string | null = null;
  if (apiKeyHeader) {
    apiKey = apiKeyHeader;
  } else if (authHeader?.startsWith("Bearer ")) {
    apiKey = authHeader.substring(7);
  } else if (urlApiKey) {
    apiKey = urlApiKey;
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Missing API Key. Provide via X-API-Key or Authorization header or ?api_key=" },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  // Authenticate user
  const user = await AuthService.findByApiKey(apiKey);
  if (!user) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Invalid API Key." },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  // Handle SSE Endpoint
  if (url.pathname === "/mcp/sse" || (req.headers.get("Accept")?.includes("text/event-stream") && req.method === "GET")) {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(
          enc.encode(`event: endpoint\ndata: ${url.origin}/mcp?api_key=${apiKey}\n\n`)
        );
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Standard JSON-RPC 2.0 over HTTP POST
  if (req.method === "POST") {
    try {
      const rpcReq = await req.json();
      const rpcRes = await McpServer.handleRpc(user.id, rpcReq);
      return new Response(JSON.stringify(rpcRes), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
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
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }
  }

  return new Response("Method not allowed", { status: 405 });
}
