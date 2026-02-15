# Property Search

An AI-powered US property search application. Users chat with an LLM-powered assistant that searches listings, compares properties, calculates mortgages, gets neighborhood info, and generates insurance quotes — all exposed as MCP (Model Context Protocol) tools through WSO2 API Manager, with Asgardeo OAuth2 authentication.

## Architecture

```
┌─────────────┐        SSE stream        ┌──────────────────┐
│   web/      │ ──────────────────────▶   │  agent-service/  │
│   React UI  │                           │  Express + LLM   │
│   :5173     │ ◀──────────────────────   │  :3002           │
└─────────────┘   text, tool calls,       └────────┬─────────┘
                  property data                    │
                                          MCP client (StreamableHTTP)
                                          APIM token (client credentials)
                                                   │
                                    ┌──────────────▼──────────────┐
                                    │   WSO2 API Manager 4.6      │
                                    │   MCP Gateway  :8243        │
                                    │                             │
                                    │  ┌───────────┐ ┌─────────┐ │
                                    │  │ Property   │ │Insurance│ │
                                    │  │ Search MCP │ │ MCP     │ │
                                    │  │ (proxy)    │ │(OpenAPI)│ │
                                    │  └─────┬─────┘ └────┬────┘ │
                                    └────────┼────────────┼──────┘
                                             │            │
                              MCP protocol   │            │  REST → MCP
                              (passthrough)  │            │  (converted)
                                             │            │
                                    ┌────────▼───┐  ┌─────▼──────┐
                                    │ mcp-server/│  │insurance-  │
                                    │ Node.js    │  │api/        │
                                    │ 9 tools    │  │Ballerina   │
                                    │ :3001      │  │ :3003      │
                                    └────────────┘  └────────────┘
```

### How It Works

1. **User chats** in the React frontend, which streams messages to the agent service via SSE
2. **Agent service** sends the conversation to an LLM (via OpenRouter), which decides which tools to call
3. **Tool calls** go through **WSO2 API Manager's MCP Gateway**, which provides:
   - OAuth2 token validation and access control
   - Rate limiting and throttling
   - Analytics and monitoring
   - Protocol translation (REST → MCP for the insurance API)
4. **Two backend services** provide the actual tools:
   - **Property Search MCP** — a native MCP server proxied through APIM
   - **Insurance API** — a REST API converted to MCP tools by APIM from its OpenAPI spec
5. **Results stream back** to the frontend as SSE events (text, tool call indicators, property data)

### Components

| Component | Port | Stack | Role |
|-----------|------|-------|------|
| **web/** | 5173 | React 19 + Vite + Tailwind CSS 4 | Chat UI with property side panel, Asgardeo login |
| **agent-service/** | 3002 | Node.js + TypeScript + Express 5 | LLM orchestration, MCP client, SSE streaming |
| **WSO2 APIM** | 8243 | WSO2 API Manager 4.6 | MCP Gateway — auth, rate limiting, REST-to-MCP |
| **mcp-server/** | 3001 | Node.js + TypeScript | 9 property search tools (search, compare, mortgage, etc.) |
| **insurance-api/** | 3003 | Ballerina Swan Lake | Insurance quote API (plans lookup, premium calculation) |

### MCP Tools Available to the LLM

**Via Property Search MCP** (proxied through APIM):

| Tool | Description |
|------|-------------|
| `search_properties` | Search properties by US state(s) and type |
| `get_available_states` | List states with available properties |
| `get_property_summary` | Property count summary by type |
| `get_property_details` | Full details for a property by ID |
| `compare_properties` | Side-by-side comparison of 2-4 properties |
| `calculate_mortgage` | Monthly payment, total interest, total cost |
| `get_neighborhood_info` | Walk score, safety, schools, amenities |
| `get_user_profile` | User's search patterns and preferences |
| `get_personalized_recommendations` | AI-ranked property recommendations |

**Via Insurance API MCP** (REST converted to MCP by APIM):

| Tool | Description |
|------|-------------|
| `getInsurancePlans` | List available insurance coverage plans |
| `generateInsuranceQuote` | Calculate insurance premium for a property |

## Quick Start

### Prerequisites

- Node.js v18+
- [Ballerina Swan Lake](https://ballerina.io/downloads/) (Update 13+)
- [WSO2 API Manager 4.6](https://wso2.com/api-manager/)
- An [OpenRouter API key](https://openrouter.ai/) for LLM access
- An [Asgardeo](https://asgardeo.io/) organization with an OAuth2 SPA configured

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
cp agent-service/.env.example agent-service/.env
cp "web/.env copy.example" web/.env
```

The agent service needs:
- `OPENROUTER_API_KEY` — for LLM access
- `APIM_CONSUMER_KEY` / `APIM_CONSUMER_SECRET` — from APIM DevPortal application
- `MCP_SERVERS` — APIM gateway MCP endpoints

### 3. Set up WSO2 API Manager

1. Start APIM: `<APIM_HOME>/bin/api-manager.sh`
2. In the **Publisher Portal** (`https://localhost:9443/publisher`):
   - Create MCP Server from existing MCP → proxy `http://localhost:3001/mcp`
   - Create MCP Server from OpenAPI → import `insurance-api/api_openapi.yaml`, set endpoint to `http://localhost:3003`
   - Deploy and publish both
3. In the **Developer Portal** (`https://localhost:9443/devportal`):
   - Create an application, subscribe to both MCP servers
   - Generate production keys (client credentials grant)
   - Add the consumer key/secret to `agent-service/.env`

### 4. Start all services

```bash
# Terminal 1: MCP Server
cd mcp-server && npm run build && npm start

# Terminal 2: Insurance API
cd insurance-api && bal run

# Terminal 3: Agent Service
cd agent-service && npm run build && npm start

# Terminal 4: Frontend
cd web && npm run dev
```

Open `http://localhost:5173`, sign in via Asgardeo, and start chatting.

## Project Structure

```
property-search/
├── web/                    # React frontend
├── agent-service/          # LLM agent + MCP client
│   └── src/mcp/
│       ├── mcpManager.ts   # Multi-server MCP client manager
│       └── apimToken.ts    # APIM client credentials token provider
├── mcp-server/             # Property search MCP server (9 tools)
├── insurance-api/          # Ballerina insurance quote REST API
│   └── api_openapi.yaml    # OpenAPI spec (used by APIM for MCP conversion)
├── CLAUDE.md               # Project conventions
└── README.md
```

See each subdirectory's README for detailed setup and configuration.
