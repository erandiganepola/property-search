# Agent Service

An AI chat agent that bridges the React frontend to MCP servers via the Anthropic API. It receives natural language questions, uses Claude to reason about which tools to call, executes those tools against MCP server(s), and streams responses back to the user in real time.

Designed for **multi-server support** — add new MCP servers by updating the `MCP_SERVERS` config.

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express 5
- **AI:** `@anthropic-ai/sdk` (Claude Sonnet)
- **MCP Client:** `@modelcontextprotocol/sdk` (StreamableHTTP transport)
- **Auth:** `jose` (JWT/JWKS verification against Asgardeo)

## Prerequisites

- Node.js v18+
- npm
- An Anthropic API key
- The [MCP Property Search Server](../mcp-server/) running locally
- An [Asgardeo](https://asgardeo.io/) organization (same as the frontend)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then set your `ANTHROPIC_API_KEY` in `.env`.

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3002` |
| `ANTHROPIC_API_KEY` | Anthropic API key | *(required)* |
| `ASGARDEO_BASE_URL` | Asgardeo org base URL | *(required)* |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `MCP_SERVERS` | JSON array of MCP server configs | *(required)* |

**MCP_SERVERS format:**

```json
[
  {"name": "property-search", "url": "http://localhost:3001/mcp"},
  {"name": "another-server", "url": "http://localhost:4001/mcp"}
]
```

Tool names are automatically namespaced as `serverName__toolName` to avoid conflicts across servers.

### 3. Build

```bash
npm run build
```

### 4. Run

```bash
npm start
```

The service starts at `http://localhost:3002`.

## API

### POST /chat

Send a chat message and receive a streamed response.

**Request:**
```json
{
  "message": "Find me rentals in California",
  "conversationId": "optional-existing-id"
}
```

**Headers:** `Authorization: Bearer <asgardeo-jwt>`

**Response:** Server-Sent Events stream:

```
data: {"type":"tool_call","name":"property-search__search_properties"}
data: {"type":"tool_result","name":"property-search__search_properties"}
data: {"type":"text","content":"Here are some"}
data: {"type":"text","content":" rentals in California..."}
data: {"type":"done","conversationId":"abc-123"}
```

### GET /health

Returns service status and connected MCP server names.

## Architecture

```
Frontend ──Bearer JWT──▶ Agent Service ──Bearer JWT──▶ MCP Server(s)
                              │
                              ▼
                        Anthropic API
                     (Claude Sonnet 4.5)
```

1. Frontend sends a chat message with the user's Asgardeo JWT
2. Agent service validates the JWT, connects to MCP servers (forwarding the JWT)
3. Claude receives the message + available tools and decides what to call
4. Agent service executes MCP tool calls and feeds results back to Claude
5. Text is streamed back to the frontend via SSE as Claude generates it

## Project Structure

```
agent-service/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── index.ts                    # Express server, /chat endpoint, JWT auth
│   ├── mcp/
│   │   └── mcpManager.ts          # Multi-server MCP client manager
│   └── agent/
│       ├── agentLoop.ts           # Anthropic streaming agentic loop
│       └── conversationStore.ts   # In-memory conversation history
└── build/                          # Compiled JavaScript output
```
