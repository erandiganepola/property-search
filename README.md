# Property Search

An AI-powered US property search application. Users chat with an LLM-powered assistant that searches listings, compares properties, calculates mortgages, and provides neighborhood info — all via MCP (Model Context Protocol) tool integration with Asgardeo OAuth2 authentication. Also includes a standalone property insurance quote REST API built with Ballerina.

## Architecture

```
web/ (React)  ──SSE stream──▶  agent-service/  ──MCP client──▶  mcp-server/
  :5173                           :3002        OpenRouter LLM      :3001

insurance-api/ (Ballerina)   ── REST API ──▶  :3003
```

| Component | Description |
|---|---|
| **web/** | React 19 + TypeScript frontend with AI chat UI, property side panel, and Asgardeo OAuth2+PKCE login |
| **agent-service/** | Express server that bridges chat messages to any LLM via OpenRouter, executes MCP tools, streams responses |
| **mcp-server/** | MCP server with 9 property search tools, JWT auth, scope-based access control |
| **insurance-api/** | Ballerina REST API for property insurance quotes with risk-based premium calculation |

## Quick Start

### 1. Install dependencies

```bash
cd mcp-server && npm install
cd ../agent-service && npm install
cd ../web && npm install
cd ../insurance-api && bal build
```

### 2. Configure environment

Each Node.js project has a `.env.example` — copy and fill in:

```bash
cp mcp-server/.env.example mcp-server/.env
cp agent-service/.env.example agent-service/.env    # Set OPENROUTER_API_KEY
cp "web/.env copy.example" web/.env                 # Set VITE_ASGARDEO_CLIENT_ID
```

The insurance API requires no configuration.

### 3. Start all services

```bash
# Terminal 1: MCP Server
cd mcp-server && npm run build && npm start

# Terminal 2: Agent Service
cd agent-service && npm run build && npm start

# Terminal 3: Frontend
cd web && npm run dev

# Terminal 4: Insurance API
cd insurance-api && bal run
```

Open `http://localhost:5173`, sign in via Asgardeo, and start chatting.

## Prerequisites

- Node.js v18+
- npm
- [Ballerina Swan Lake](https://ballerina.io/downloads/) (Update 13+) for the insurance API
- An [OpenRouter API key](https://openrouter.ai/) for LLM access
- An [Asgardeo](https://asgardeo.io/) organization with an OAuth2 SPA configured

See each subdirectory's README for detailed setup and configuration.
