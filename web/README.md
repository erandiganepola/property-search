# Web — US Property Search Frontend

A React web application with an AI chat interface for US property search. Authenticated via **Asgardeo** (WSO2 Identity) using OAuth2 + PKCE. Communicates with the [Agent Service](../agent-service/) which orchestrates MCP tool calls via any LLM through OpenRouter.

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4 with `@tailwindcss/typography`
- **Font:** Plus Jakarta Sans (Google Fonts)
- **Icons:** lucide-react
- **Auth:** `@asgardeo/auth-react` 5.4 (OAuth2 + PKCE)
- **AI Chat:** Streams responses from the Agent Service via SSE
- **Markdown:** react-markdown with remark-gfm (tables, lists, etc.)

## Prerequisites

- Node.js v18+
- npm
- An [Asgardeo](https://asgardeo.io/) organization with a Single Page Application configured
- The [Agent Service](../agent-service/) and [MCP Server](../property-search-mcp/) running locally

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp ".env copy.example" .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_ASGARDEO_CLIENT_ID` | OAuth2 client ID from Asgardeo | *(required)* |
| `VITE_ASGARDEO_BASE_URL` | Asgardeo org base URL | *(required)* |
| `VITE_ASGARDEO_SIGN_IN_REDIRECT_URL` | OAuth2 sign-in redirect | `http://localhost:5173` |
| `VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL` | OAuth2 sign-out redirect | `http://localhost:5173` |
| `VITE_AGENT_SERVICE_URL` | Agent service URL | `http://localhost:3002` |

### 3. Start the dev server

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

## Features

- **AI Chat Interface** — natural language property search powered by any LLM via OpenRouter
- **OAuth2 + PKCE login** via Asgardeo with a polished login page
- **Streaming responses** — text appears word-by-word as the LLM generates it
- **Inline tool indicators** — shows which MCP tools the agent is using with spinner/checkmark
- **Property side panel** — slide-over panel to browse properties returned by the agent
- **Markdown rendering** — rich formatting with tables, lists, and headings via remark-gfm
- **Responsive design** — works on mobile, tablet, and desktop

## Project Structure

```
web/
├── package.json
├── vite.config.js
├── tsconfig.json
├── .env copy.example
├── README.md
├── index.html
├── src/
│   ├── main.tsx                 # Entry point, Asgardeo AuthProvider setup
│   ├── App.tsx                  # Auth flow + ChatView
│   ├── index.css                # Tailwind CSS, typography plugin, table styles
│   ├── api/
│   │   └── agentClient.ts      # SSE client for agent service
│   ├── components/
│   │   ├── Header.tsx           # Nav bar with user name and sign-out
│   │   ├── LoginPage.tsx        # OAuth2 login screen
│   │   ├── ChatView.tsx         # Chat container with message list and panel state
│   │   ├── ChatMessage.tsx      # Message bubble with markdown and tool indicators
│   │   ├── ChatInput.tsx        # Text input with send button
│   │   ├── PropertyPanel.tsx    # Slide-over side panel for property cards
│   │   ├── PropertyCard.tsx     # Property card component
│   │   ├── PropertyList.tsx     # Property grid list
│   │   └── StateSelector.tsx    # Multi-select state dropdown
│   └── data/
│       └── properties.ts        # Types and US states list
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
