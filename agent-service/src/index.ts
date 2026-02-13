#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { McpManager } from "./mcp/mcpManager.js";
import type { McpServerConfig } from "./mcp/mcpManager.js";
import { runAgentLoop } from "./agent/agentLoop.js";
import type { SSEEvent } from "./agent/agentLoop.js";

// --- Configuration ---
const PORT = parseInt(process.env.PORT || "3002", 10);
const ASGARDEO_BASE_URL = process.env.ASGARDEO_BASE_URL || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

let mcpServers: McpServerConfig[];
try {
  mcpServers = JSON.parse(process.env.MCP_SERVERS || "[]");
} catch {
  console.error("MCP_SERVERS must be a valid JSON array");
  process.exit(1);
}

if (!ASGARDEO_BASE_URL) {
  console.error("ASGARDEO_BASE_URL environment variable is required");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY environment variable is required");
  process.exit(1);
}

if (mcpServers.length === 0) {
  console.error("MCP_SERVERS must contain at least one server");
  process.exit(1);
}

// --- JWT Verification ---
const jwksUrl = new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`);
const JWKS = createRemoteJWKSet(jwksUrl);
const expectedIssuer = `${ASGARDEO_BASE_URL}/oauth2/token`;

async function verifyToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: expectedIssuer,
  });
  return token; // Return the validated token for forwarding to MCP servers
}

// --- Per-user MCP Manager cache ---
// Keyed by access token hash (tokens are short-lived, so this self-cleans on expiry)
const mcpManagers = new Map<string, McpManager>();

async function getOrCreateMcpManager(accessToken: string): Promise<McpManager> {
  // Use a simple key — in production you'd want token-hash or sub claim
  const key = accessToken.slice(-16);

  let manager = mcpManagers.get(key);
  if (manager) return manager;

  manager = new McpManager();
  await manager.connect(mcpServers, accessToken);
  mcpManagers.set(key, manager);
  return manager;
}

// --- Express App ---
const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// POST /chat — SSE streaming chat endpoint
app.post("/chat", async (req, res) => {
  // Extract and validate Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Bearer token" });
    return;
  }

  const accessToken = authHeader.slice(7);

  try {
    await verifyToken(accessToken);
  } catch (err) {
    console.error("[Auth] Token verification failed:", err);
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const { message, conversationId: incomingConvId } = req.body as {
    message?: string;
    conversationId?: string;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const conversationId = incomingConvId || randomUUID();

  // Set up SSE response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event: SSEEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const mcpManager = await getOrCreateMcpManager(accessToken);
    await runAgentLoop(message, conversationId, mcpManager, sendEvent);
  } catch (err) {
    console.error("[Chat] Error:", err);
    sendEvent({
      type: "error",
      content: err instanceof Error ? err.message : "Internal error",
    });
  }

  res.end();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", mcpServers: mcpServers.map((s) => s.name) });
});

app.listen(PORT, () => {
  console.log(`Agent service running on port ${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  console.log(`Asgardeo base URL: ${ASGARDEO_BASE_URL}`);
  console.log(
    `MCP servers: ${mcpServers.map((s) => `${s.name} (${s.url})`).join(", ")}`
  );
});
