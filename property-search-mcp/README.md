# MCP Property Search Server

An MCP (Model Context Protocol) server that provides AI assistants and web clients with tools to search, compare, and analyze US property listings. It exposes short-term rentals, long-term rentals, and properties for sale across 8 US states.

The server can integrate with **Asgardeo** (WSO2 Identity) for OAuth2 JWT authentication and enforce **scope-based access control** — users only see property types their token scopes allow (`list-rent`, `list-sale`). Auth is gated by the `AUTH_ENABLED` env var (default `false`); when running behind an API gateway that already terminates authentication (e.g. WSO2 Choreo), leave it off and the gateway is the source of truth.

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express 5
- **MCP SDK:** `@modelcontextprotocol/sdk` 1.12
- **Auth:** `jose` (JWT/JWKS verification against Asgardeo)
- **Validation:** `zod` (tool input schemas)
- **Transport:** Streamable HTTP with SSE (MCP protocol 2025-03-26)

## Prerequisites

- Node.js v18+
- npm
- An [Asgardeo](https://asgardeo.io/) organization with an OAuth2 application configured

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3001` |
| `CORS_ORIGIN` | Allowed CORS origin for the frontend | `http://localhost:5173` |
| `AUTH_ENABLED` | Enforce Asgardeo JWT verification + scope-based filtering. Set to `false` when an upstream gateway handles auth. | `false` |
| `ASGARDEO_BASE_URL` | Asgardeo org base URL (e.g. `https://api.asgardeo.io/t/myorg`). Only required when `AUTH_ENABLED=true`. | *(empty)* |

### 3. Build

```bash
npm run build
```

### 4. Run

```bash
npm start
```

The server starts at `http://localhost:3001/mcp` and accepts MCP protocol messages over HTTP POST. With `AUTH_ENABLED=true`, requests must carry a Bearer token issued by the configured Asgardeo org. With `AUTH_ENABLED=false` (the default), the server accepts requests without a token and is intended to sit behind a gateway that enforces auth.

## Available Tools (9)

| Tool | Description |
|---|---|
| `search_properties` | Search by US state(s), optional type filter. Scope-filtered. |
| `get_available_states` | List all states with property listings. |
| `get_property_summary` | Property count breakdown by type. Scope-filtered. |
| `get_property_details` | Full details for a property by ID. Scope-filtered. |
| `compare_properties` | Side-by-side comparison of 2-4 properties. Scope-filtered. |
| `calculate_mortgage` | Monthly payment, interest, and total cost calculator. |
| `get_neighborhood_info` | Walk score, safety, schools, transit for a city. |
| `get_user_profile` | User preference profile from session activity. |
| `get_personalized_recommendations` | Scored property recommendations based on activity. Scope-filtered. |

## Access Control

When `AUTH_ENABLED=true`, the server validates JWT access tokens against Asgardeo's JWKS endpoint and filters property results based on the token's OAuth scopes:

- `list-rent` scope grants access to `short-rent` and `long-rent` properties
- `list-sale` scope grants access to `sale` properties

When `AUTH_ENABLED=false`, the bearer-auth middleware is replaced with a passthrough; tool calls run without scope filtering, returning all property types. Use this mode only when an upstream gateway is enforcing authentication.

## Dataset

28 properties across 8 states: California (4), New York (4), Texas (4), Florida (4), Colorado (3), Washington (3), Illinois (3), Georgia (3).

21 neighborhoods with walk scores, safety ratings, school ratings, and transit scores.

## Project Structure

```
property-search-mcp/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── index.ts              # Express server, MCP tools, session management
│   ├── auth/
│   │   ├── scopeFilter.ts    # Scope-based property filtering
│   │   ├── sessionContext.ts  # Per-session user context storage
│   │   └── tokenVerifier.ts   # Asgardeo JWT/JWKS verification
│   └── data/
│       ├── properties.ts      # Property dataset and types
│       ├── neighborhoods.ts   # Neighborhood info dataset
│       └── userActivity.ts    # User activity tracking and profiling
└── build/                     # Compiled JavaScript output
```
