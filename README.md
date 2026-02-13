# US Property Search

A React web application for browsing US property listings (short-term rentals, long-term rentals, and properties for sale). Authenticated via **Asgardeo** (WSO2 Identity) using OAuth2 + PKCE, and powered by an MCP (Model Context Protocol) backend server for property data.

The UI dynamically adapts to each user's OAuth scopes — users only see property categories their token grants access to.

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Auth:** `@asgardeo/auth-react` 5.4 (OAuth2 + PKCE)
- **Backend:** MCP protocol client over HTTP with SSE

## Prerequisites

- Node.js v18+
- npm
- An [Asgardeo](https://asgardeo.io/) organization with a Single Page Application configured
- The [MCP Property Search Server](../mcp-property-search/) running locally

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Asgardeo credentials:

```bash
cp ".env copy.example" .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_ASGARDEO_CLIENT_ID` | OAuth2 client ID from Asgardeo | *(required)* |
| `VITE_ASGARDEO_BASE_URL` | Asgardeo org base URL (e.g. `https://api.asgardeo.io/t/myorg`) | *(required)* |
| `VITE_ASGARDEO_SIGN_IN_REDIRECT_URL` | OAuth2 sign-in redirect | `http://localhost:5173` |
| `VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL` | OAuth2 sign-out redirect | `http://localhost:5173` |
| `VITE_MCP_SERVER_URL` | MCP backend server URL | `http://localhost:3001/mcp` |

### 3. Start the MCP backend

Make sure the MCP Property Search server is running first:

```bash
cd ../mcp-property-search
npm install && npm run build && npm start
```

### 4. Start the dev server

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

## Features

- **OAuth2 + PKCE login** via Asgardeo with a polished login page
- **Scope-based UI** — category tabs (Short-Term Rental, Long-Term Rental, For Sale) show/hide based on user's `list-rent` and `list-sale` scopes
- **Multi-state search** — select one or more US states with a searchable dropdown
- **MCP protocol client** — communicates with the backend via JSON-RPC 2.0 over HTTP with SSE support and automatic session management
- **Responsive design** — works on mobile, tablet, and desktop
- **User greeting** — displays the authenticated user's name from the ID token

## Project Structure

```
property-search/
├── package.json
├── vite.config.js
├── tsconfig.json
├── .env copy.example
├── .gitignore
├── README.md
├── index.html
├── src/
│   ├── main.tsx               # Entry point, Asgardeo AuthProvider setup
│   ├── App.tsx                # Main app: auth state, MCP integration, filtering
│   ├── index.css              # Tailwind CSS import
│   ├── api/
│   │   └── mcpClient.ts      # MCP protocol client (session, init, tool calls)
│   ├── components/
│   │   ├── Header.tsx         # Nav bar with user name and sign-out
│   │   ├── LoginPage.tsx      # OAuth2 login screen
│   │   ├── StateSelector.tsx  # Multi-select US state dropdown
│   │   ├── CategoryTabs.tsx   # Scope-aware property type filter tabs
│   │   ├── PropertyList.tsx   # Responsive property grid
│   │   └── PropertyCard.tsx   # Individual property card
│   └── data/
│       └── properties.ts      # Types and US states list
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
