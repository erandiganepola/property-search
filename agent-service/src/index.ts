#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { McpManager } from "./mcp/mcpManager.js";
import type { McpServerConfig } from "./mcp/mcpManager.js";
import { getApimToken } from "./mcp/apimToken.js";
import { runAgentLoop } from "./agent/agentLoop.js";
import type { SSEEvent } from "./agent/agentLoop.js";

// --- Configuration ---
const PORT = parseInt(process.env.PORT || "3002", 10);
const ASGARDEO_BASE_URL = process.env.ASGARDEO_BASE_URL || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Toggle for application-layer Asgardeo JWT verification on POST /chat.
// Default false so deployments behind an API gateway (e.g. WSO2 Choreo)
// that already enforces auth don't need extra config. Set to "true" to
// require a valid Bearer token issued by the configured Asgardeo org.
const AUTH_ENABLED = process.env.AUTH_ENABLED === "true";

let mcpServers: McpServerConfig[];
try {
  mcpServers = JSON.parse(process.env.MCP_SERVERS || "[]");
} catch {
  console.error("MCP_SERVERS must be a valid JSON array");
  process.exit(1);
}

if (AUTH_ENABLED && !ASGARDEO_BASE_URL) {
  console.error("ASGARDEO_BASE_URL is required when AUTH_ENABLED=true");
  process.exit(1);
}

if (mcpServers.length === 0) {
  console.error("MCP_SERVERS must contain at least one server");
  process.exit(1);
}

// --- JWT Verification (frontend auth) ---
// Only initialise the JWKS resolver when auth is enabled — it makes a
// network call to the issuer so we want to skip it in gateway-fronted mode.
const JWKS = AUTH_ENABLED
  ? createRemoteJWKSet(new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`))
  : null;
const expectedIssuer = AUTH_ENABLED ? `${ASGARDEO_BASE_URL}/oauth2/token` : "";

async function verifyToken(token: string): Promise<void> {
  if (!JWKS) return;
  await jwtVerify(token, JWKS, { issuer: expectedIssuer });
}

// --- Shared MCP Manager (APIM-authenticated) ---
let mcpManager: McpManager | null = null;

async function initMcpManager(): Promise<McpManager> {
  const token = await getApimToken();
  const manager = new McpManager();
  await manager.connect(mcpServers, token);
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
  // Extract and validate Bearer token (Asgardeo — frontend auth).
  // Skipped entirely when AUTH_ENABLED is false; the upstream gateway is
  // expected to enforce auth in that mode.
  if (AUTH_ENABLED) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing Bearer token" });
      return;
    }

    try {
      await verifyToken(authHeader.slice(7));
    } catch (err) {
      console.error("[Auth] Token verification failed:", err);
      res.status(401).json({ error: "Invalid token" });
      return;
    }
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
  const isNew = !incomingConvId;
  console.log(
    `[Chat] Request received — conversationId: ${conversationId}${isNew ? " (new)" : ""}, messageLength: ${message.length}`
  );

  // Set up SSE response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event: SSEEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    if (!mcpManager) {
      throw new Error("MCP manager not initialized");
    }
    await runAgentLoop(message, conversationId, mcpManager, sendEvent);
    console.log(`[Chat] Request complete — conversationId: ${conversationId}`);
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

// --- Startup ---
async function start() {
  try {
    mcpManager = await initMcpManager();
  } catch (err) {
    console.error("[Startup] Failed to initialize MCP manager:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Agent service running on port ${PORT}`);
    console.log(`Model: ${process.env.MODEL || "anthropic/claude-sonnet-4.5"}`);
    console.log(
      `LLM base URL: ${process.env.LLM_BASE_URL || "https://api.openai.com/v1"} (key: ${process.env.LLM_API_KEY ? "LLM_API_KEY" : "APIM token"})`
    );
    console.log(`CORS origin: ${CORS_ORIGIN}`);
    console.log(
      `Auth enabled: ${AUTH_ENABLED}${AUTH_ENABLED ? ` (Asgardeo: ${ASGARDEO_BASE_URL})` : " (gateway-enforced)"}`
    );
    console.log(
      `MCP servers: ${mcpServers.map((s) => `${s.name} (${s.url})`).join(", ")}`
    );
  });
}

start();
