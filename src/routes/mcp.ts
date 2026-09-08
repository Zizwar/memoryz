import { McpServer, MCP_TOOLS } from "../mcp/server.ts";
import { AuthService, User } from "../services/auth.ts";
import { OAuthService } from "../services/oauth.ts";

export async function handleMcpRoute(req: Request, url: URL): Promise<Response> {
  const origin = url.origin;
  const path = url.pathname;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, mcp-session-id, Last-Event-ID",
    "Access-Control-Expose-Headers": "mcp-session-id, Content-Type, WWW-Authenticate",
  };

  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // --- 1. OAuth 2.1 Discovery (RFC 9728 & RFC 8414, matching SunoMA) ---
  if (path === "/.well-known/oauth-protected-resource" || path === "/.well-known/oauth-protected-resource/mcp") {
    return new Response(
      JSON.stringify({
        resource: `${origin}/mcp`,
        authorization_servers: [origin],
        scopes_supported: ["mcp"],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  if (path === "/.well-known/oauth-authorization-server" || path === "/.well-known/openid-configuration") {
    return new Response(
      JSON.stringify({
        issuer: origin,
        authorization_endpoint: `${origin}/oauth/authorize`,
        token_endpoint: `${origin}/oauth/token`,
        registration_endpoint: `${origin}/oauth/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
        scopes_supported: ["mcp"],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  // --- 2. Dynamic Client Registration (RFC 7591) ---
  if (path === "/oauth/register" && req.method === "POST") {
    try {
      const b = await req.json().catch(() => ({}));
      const redirectUris: string[] = Array.isArray(b.redirect_uris) ? b.redirect_uris : [];
      const client = OAuthService.registerClient(redirectUris, b.client_name);
      return new Response(
        JSON.stringify({
          client_id: client.clientId,
          redirect_uris: client.redirectUris,
          client_name: client.name,
          token_endpoint_auth_method: "none",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        }
      );
    } catch (_e) {
      return new Response(JSON.stringify({ error: "invalid_request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // --- 3. OAuth Authorize Endpoint ---
  if (path === "/oauth/authorize" && req.method === "GET") {
    const clientId = url.searchParams.get("client_id") || "";
    const redirectUri = url.searchParams.get("redirect_uri") || "";
    const responseType = url.searchParams.get("response_type") || "";
    const codeChallenge = url.searchParams.get("code_challenge") || "";
    const state = url.searchParams.get("state") || "";

    // If client provided, serve instant auto-grant consent page or redirect
    const consentHtml = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8"><title>MemoryZ — ربط المحادثة</title>
      <style>body{background:#090d16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
      .box{background:#0f172a;border:1px solid #38bdf8;border-radius:16px;padding:32px;max-width:420px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.6);}
      button{background:#0284c7;color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:16px;cursor:pointer;margin-top:16px;width:100%;font-weight:700;}
      </style>
    </head>
    <body>
      <div class="box">
        <div style="font-size:40px; margin-bottom:12px;">🧠</div>
        <h2>ربط MemoryZ مع تطبيق الدردشة</h2>
        <p style="color:#94a3b8; font-size:14px; margin-top:10px;">سيسمح هذا للتطبيق باستدعاء وتخزين ذكرياتك الحية تلقائياً.</p>
        <form method="POST" action="/oauth/approve">
          <input type="hidden" name="client_id" value="${clientId}">
          <input type="hidden" name="redirect_uri" value="${redirectUri}">
          <input type="hidden" name="code_challenge" value="${codeChallenge}">
          <input type="hidden" name="state" value="${state}">
          <button type="submit">الموافقة والربط الفوري ✓</button>
        </form>
      </div>
    </body>
    </html>`;

    return new Response(consentHtml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // --- 4. OAuth Approve Decision ---
  if (path === "/oauth/approve" && req.method === "POST") {
    const formData = await req.formData();
    const clientId = formData.get("client_id")?.toString() || "";
    const redirectUri = formData.get("redirect_uri")?.toString() || "";
    const codeChallenge = formData.get("code_challenge")?.toString() || "";
    const state = formData.get("state")?.toString() || "";

    // Pick first active user or admin
    const stats = await AuthService.getPlatformStats();
    const userId = stats.users && stats.users.length > 0 ? stats.users[0].id : "default_user";

    const code = "mz_code_" + crypto.randomUUID().replace(/-/g, "");
    OAuthService.putCode(code, {
      userId,
      clientId,
      redirectUri,
      codeChallenge,
      resource: `${origin}/mcp`,
      exp: Date.now() + 5 * 60 * 1000,
    });

    const sep = redirectUri.includes("?") ? "&" : "?";
    const redirectTarget = `${redirectUri}${sep}code=${code}&state=${encodeURIComponent(state)}`;
    return Response.redirect(redirectTarget, 302);
  }

  // --- 5. OAuth Token Exchange Endpoint ---
  if (path === "/oauth/token" && req.method === "POST") {
    let grantType = "";
    let code = "";
    let redirectUri = "";
    let codeVerifier = "";
    let refreshToken = "";

    const ctype = req.headers.get("Content-Type") || "";
    if (ctype.includes("application/json")) {
      const b = await req.json().catch(() => ({}));
      grantType = b.grant_type || "";
      code = b.code || "";
      redirectUri = b.redirect_uri || "";
      codeVerifier = b.code_verifier || "";
      refreshToken = b.refresh_token || "";
    } else {
      const fd = await req.formData();
      grantType = fd.get("grant_type")?.toString() || "";
      code = fd.get("code")?.toString() || "";
      redirectUri = fd.get("redirect_uri")?.toString() || "";
      codeVerifier = fd.get("code_verifier")?.toString() || "";
      refreshToken = fd.get("refresh_token")?.toString() || "";
    }

    if (grantType === "authorization_code") {
      const rec = OAuthService.takeCode(code);
      if (!rec) {
        return new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify(OAuthService.issueTokens(rec.userId, rec.clientId, rec.resource)),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    if (grantType === "refresh_token") {
      const rec = OAuthService.getToken(refreshToken);
      if (!rec || rec.type !== "refresh") {
        return new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify(OAuthService.issueTokens(rec.userId, rec.clientId, rec.resource)),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "unsupported_grant_type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- 6. MCP Protocol Authentication Verification ---
  // Resolves token from Authorization Header, X-API-Key, or Query (?token=, ?key=, ?api_key=, ?apiKey=)
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

  let currentUser: User | null = null;
  if (token) {
    // Check API Key
    currentUser = await AuthService.findByApiKey(token);
    // Check OAuth Token
    if (!currentUser) {
      const oauthRec = OAuthService.getToken(token);
      if (oauthRec) {
        currentUser = await AuthService.findById(oauthRec.userId);
      }
    }
    // Check JWT session
    if (!currentUser) {
      const decoded = await AuthService.verifyToken(token);
      if (decoded) {
        currentUser = await AuthService.findById(decoded.sub);
      }
    }
  }

  // Challenge unauthenticated clients (RFC 9728 OAuth challenge for Claude/ChatGPT)
  if (!currentUser) {
    // If standard browser GET request without token -> Show status
    if (req.method === "GET" && !req.headers.get("Accept")?.includes("text/event-stream")) {
      return new Response(
        JSON.stringify({
          name: "MemoryZ MCP Server",
          status: "ready",
          transport: "Streamable HTTP & SSE",
          endpoint: `${origin}/mcp`,
          auth: "OAuth 2.1 or ?token=<API_KEY>",
          tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
        }, null, 2),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    // Return WWW-Authenticate header challenge
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Unauthorized" },
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
        },
      }
    );
  }

  // --- 7. MCP SSE Streaming Endpoint ---
  const acceptsSse = req.headers.get("Accept")?.includes("text/event-stream");
  const isSsePath = path === "/sse" || path === "/mcp/sse" || path === "/api/mcp/sse";
  const wantsSse = url.searchParams.get("transport") === "sse";

  if (req.method === "GET" && (acceptsSse || isSsePath || wantsSse)) {
    const sessionId = req.headers.get("mcp-session-id") || crypto.randomUUID();
    const enc = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          enc.encode(`event: endpoint\ndata: ${origin}/mcp?token=${token}&session_id=${sessionId}\n\n`)
        );
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

  // Standard GET on /mcp with authenticated user
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        name: "MemoryZ MCP Server",
        user: currentUser.username,
        status: "connected",
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

  // --- 8. POST: MCP JSON-RPC 2.0 (Stateless & Batch-Capable, matches SunoMA) ---
  if (req.method === "POST") {
    const sessionId = req.headers.get("mcp-session-id") || url.searchParams.get("session_id") || crypto.randomUUID();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle batch requests
    if (Array.isArray(body)) {
      const out = [];
      for (const m of body) {
        const r = await McpServer.handleRpc(currentUser.id, m);
        if (r) out.push(r);
      }
      return out.length
        ? new Response(JSON.stringify(out), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "mcp-session-id": sessionId },
          })
        : new Response(null, { status: 204, headers: corsHeaders });
    }

    // Handle single request
    const r = await McpServer.handleRpc(currentUser.id, body);
    if (!r) {
      // Notification -> No Content (204)
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(JSON.stringify(r), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "mcp-session-id": sessionId,
      },
    });
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
