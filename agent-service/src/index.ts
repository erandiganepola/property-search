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

if (!process.env.OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY environment variable is required");
  process.exit(1);
}

if (mcpServers.length === 0) {
  console.error("MCP_SERVERS must contain at least one server");
  process.exit(1);
}

// --- JWT Verification (frontend auth) ---
const jwksUrl = new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`);
const JWKS = createRemoteJWKSet(jwksUrl);
const expectedIssuer = `${ASGARDEO_BASE_URL}/oauth2/token`;

async function verifyToken(token: string): Promise<void> {
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
  // Extract and validate Bearer token (Asgardeo — frontend auth)
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
      `LLM base URL: ${process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"}`
    );
    console.log(`CORS origin: ${CORS_ORIGIN}`);
    console.log(
      `MCP servers: ${mcpServers.map((s) => `${s.name} (${s.url})`).join(", ")}`
    );
  });
}

start();
