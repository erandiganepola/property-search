# MCP Property Search Server

An MCP (Model Context Protocol) server that provides AI assistants and web clients with tools to search, compare, and analyze US property listings. It exposes short-term rentals, long-term rentals, and properties for sale across 8 US states.

The server integrates with **Asgardeo** (WSO2 Identity) for OAuth2 JWT authentication and enforces **scope-based access control** — users only see property types their token scopes allow (`list-rent`, `list-sale`).

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
| `ASGARDEO_BASE_URL` | Asgardeo org base URL (e.g. `https://api.asgardeo.io/t/myorg`) | *(required)* |
| `CORS_ORIGIN` | Allowed CORS origin for the frontend | `http://localhost:5173` |

### 3. Build

```bash
npm run build
```

### 4. Run

```bash
npm start
```

The server starts at `http://localhost:3001/mcp` and accepts MCP protocol messages over HTTP POST with Bearer token authentication.

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

The server validates JWT access tokens against Asgardeo's JWKS endpoint. Property results are filtered based on the token's OAuth scopes:

- `list-rent` scope grants access to `short-rent` and `long-rent` properties
- `list-sale` scope grants access to `sale` properties

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
