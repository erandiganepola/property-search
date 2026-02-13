import type { Property } from "../data/properties";

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || "http://localhost:3001/mcp";

let sessionId: string | null = null;
let requestIdCounter = 0;
let initialized = false;

async function mcpPost(body: unknown, accessToken: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${accessToken}`,
  };
  if (sessionId) {
    headers["mcp-session-id"] = sessionId;
  }

  console.log("[MCP] >>> POST", JSON.stringify(body));
  console.log("[MCP] >>> headers", { sessionId, contentType: headers["Content-Type"], accept: headers.Accept });

  const res = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  console.log("[MCP] <<< status", res.status, res.statusText);
  console.log("[MCP] <<< content-type", res.headers.get("content-type"));
  console.log("[MCP] <<< mcp-session-id", res.headers.get("mcp-session-id"));

  return res;
}

// Parse response — handles both JSON and SSE formats.
// SSE streams stay open as a session channel, so we must read incrementally
// and cancel once we have the first JSON-RPC message.
async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  console.log("[MCP] parseResponse content-type:", contentType);

  if (contentType.includes("text/event-stream")) {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("[MCP] SSE stream ended. buffer:", buffer);
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      console.log("[MCP] SSE chunk:", JSON.stringify(chunk));

      // Look for a complete "data: " line with valid JSON
      for (const line of buffer.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(line.slice(6));
            console.log("[MCP] SSE parsed message:", parsed);
            reader.cancel();
            return parsed;
          } catch {
            // incomplete JSON, keep reading
          }
        }
      }
    }

    throw new Error("No data in SSE response");
  }

  // Not SSE — try to read as JSON, but handle empty bodies (e.g. 202 for notifications)
  const text = await response.text();
  console.log("[MCP] Raw response body:", text.slice(0, 500));
  if (!text) return null;
  return JSON.parse(text);
}

async function ensureInitialized(accessToken: string): Promise<void> {
  if (initialized && sessionId) {
    console.log("[MCP] Already initialized, sessionId:", sessionId);
    return;
  }

  console.log("[MCP] === Starting initialization ===");

  // Send initialize request
  const initRes = await mcpPost(
    {
      jsonrpc: "2.0",
      id: ++requestIdCounter,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "property-search-web", version: "1.0.0" },
      },
    },
    accessToken
  );

  const newSessionId = initRes.headers.get("mcp-session-id");
  console.log("[MCP] Got session ID from initialize:", newSessionId);
  if (newSessionId) {
    sessionId = newSessionId;
  }

  const initData = await parseResponse(initRes);
  console.log("[MCP] Initialize response data:", initData);

  // Send initialized notification
  console.log("[MCP] Sending notifications/initialized...");
  const notifRes = await mcpPost(
    {
      jsonrpc: "2.0",
      method: "notifications/initialized",
    },
    accessToken
  );
  console.log("[MCP] notifications/initialized status:", notifRes.status);

  initialized = true;
  console.log("[MCP] === Initialization complete ===");
}

async function callTool(
  toolName: string,
  args: Record<string, unknown>,
  accessToken: string
): Promise<string> {
  await ensureInitialized(accessToken);

  console.log("[MCP] Calling tool:", toolName, args);
  const response = await mcpPost(
    {
      jsonrpc: "2.0",
      id: ++requestIdCounter,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    },
    accessToken
  );

  // Handle session expiry
  if (response.status === 404 || response.status === 401) {
    console.log("[MCP] Session expired or unauthorized, resetting...");
    resetMcpSession();
    await ensureInitialized(accessToken);

    const retryResponse = await mcpPost(
      {
        jsonrpc: "2.0",
        id: ++requestIdCounter,
        method: "tools/call",
        params: { name: toolName, arguments: args },
      },
      accessToken
    );

    const retryData = (await parseResponse(retryResponse)) as { error?: { message: string }; result?: { content: { text: string }[] } };
    if (retryData.error) throw new Error(retryData.error.message);
    return retryData.result!.content[0].text;
  }

  const data = (await parseResponse(response)) as { error?: { message: string }; result?: { content: { text: string }[] } };
  console.log("[MCP] Tool response:", JSON.stringify(data).slice(0, 200));
  if (data.error) throw new Error(data.error.message);
  return data.result!.content[0].text;
}

export async function searchProperties(
  accessToken: string,
  states: string[],
  type?: string
): Promise<Property[]> {
  const text = await callTool(
    "search_properties",
    { states, ...(type ? { type } : {}) },
    accessToken
  );
  return JSON.parse(text) as Property[];
}

export function resetMcpSession(): void {
  console.log("[MCP] Session reset");
  sessionId = null;
  requestIdCounter = 0;
  initialized = false;
}
