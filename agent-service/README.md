# Agent Service

An AI chat agent that bridges the React frontend to MCP servers via WSO2 API Manager. It receives natural language questions, uses an LLM to reason about which tools to call, executes those tools against MCP server(s), and streams responses back to the user in real time.

Both **LLM calls** and **MCP tool calls** are routed through WSO2 APIM using client credentials OAuth2 tokens. The LLM model is configurable via the `MODEL` environment variable. Designed for **multi-server support** — add new MCP servers by updating the `MCP_SERVERS` config.

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express 5
- **AI:** `openai` SDK via WSO2 APIM AI Gateway (proxied OpenAI)
- **MCP Client:** `@modelcontextprotocol/sdk` (StreamableHTTP transport via APIM MCP Gateway)
- **Auth:** `jose` (JWT/JWKS verification against Asgardeo for frontend), APIM client credentials for backend

## Prerequisites

- Node.js v18+
- npm
- [WSO2 API Manager 4.6](https://wso2.com/api-manager/) with AI Gateway and MCP Gateway configured
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

Then configure the APIM and LLM settings in `.env`.

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3002` |
| `LLM_BASE_URL` | APIM AI Gateway endpoint | `https://api.openai.com/v1` |
| `MODEL` | LLM model ID | `gpt-4o-mini` |
| `APIM_CONSUMER_KEY` | APIM application consumer key | *(required)* |
| `APIM_CONSUMER_SECRET` | APIM application consumer secret | *(required)* |
| `APIM_TOKEN_URL` | APIM token endpoint | `https://localhost:9443/oauth2/token` |
| `ASGARDEO_BASE_URL` | Asgardeo org base URL | *(required)* |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `MCP_SERVERS` | JSON array of MCP server configs (APIM gateway URLs) | *(required)* |

**MCP_SERVERS format:**

```json
[
  {"name": "property-search", "url": "https://localhost:8243/property-search/1.0.0/mcp"},
  {"name": "insurance", "url": "https://localhost:8243/insurance/1.0.0/mcp"}
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
data: {"type":"properties","content":"[{...}]"}
data: {"type":"done","conversationId":"abc-123"}
```

### GET /health

Returns service status and connected MCP server names.

## Architecture

```
Frontend ──Asgardeo JWT──▶ Agent Service ──APIM Token──▶ WSO2 APIM :8243
                                                              │
                                              ┌───────────────┼───────────────┐
                                              ▼               ▼               ▼
                                        AI Gateway      MCP Gateway      MCP Gateway
                                        (OpenAI)     (Property Search)  (Insurance)
                                              │               │               │
                                              ▼               ▼               ▼
                                         OpenAI API     mcp-server/    insurance-api/
```

1. Frontend sends a chat message with the user's Asgardeo JWT
2. Agent service validates the JWT, obtains an APIM token via client credentials
3. LLM calls go through APIM AI Gateway → OpenAI (APIM handles the OpenAI API key)
4. The LLM decides which tools to call; tool calls go through APIM MCP Gateway
5. Agent service executes MCP tool calls and feeds results back to the LLM
6. Text is streamed back to the frontend via SSE as the LLM generates it

## Project Structure

```
agent-service/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── src/
│   ├── index.ts                    # Express server, /chat endpoint, JWT auth
│   ├── mcp/
│   │   ├── mcpManager.ts          # Multi-server MCP client manager
│   │   └── apimToken.ts           # APIM client credentials token provider
│   └── agent/
│       ├── agentLoop.ts           # OpenAI SDK streaming agentic loop (via APIM)
│       └── conversationStore.ts   # In-memory conversation history
└── build/                          # Compiled JavaScript output
```
