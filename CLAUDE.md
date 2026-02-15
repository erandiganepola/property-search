# CLAUDE.md

Project-level instructions for Claude Code.

## Commit style

- Do NOT add `Co-Authored-By: Claude` lines to commits
- Commit messages: imperative subject line, blank line, bullet-point body explaining what changed

## Project layout

Monorepo with 4 services, each in its own subfolder:

| Service | Port | Stack | Build & Run |
|---------|------|-------|-------------|
| `mcp-server/` | 3001 | Node.js + TypeScript + Express 5 | `npm run build && npm start` |
| `agent-service/` | 3002 | Node.js + TypeScript + Express 5 | `npm run build && npm start` |
| `insurance-api/` | 3003 | Ballerina Swan Lake | `bal build && bal run` |
| `web/` | 5173 | React 19 + Vite + Tailwind CSS 4 | `npm run dev` |

## Key technical decisions

- **LLM access**: Via OpenRouter (OpenAI SDK), NOT Anthropic SDK directly. Model is configurable via `MODEL` env var.
- **Current model**: `deepseek/deepseek-v3.2` (set in agent-service/.env)
- **MCP transport**: StreamableHTTP (not stdio)
- **Auth**: Asgardeo OAuth2+PKCE. JWT verified via JWKS. Scopes: `list-rent`, `list-sale`.
- **Frontend icons**: lucide-react (no inline SVGs)
- **Frontend font**: Plus Jakarta Sans (Google Fonts)
- **Frontend markdown**: react-markdown + remark-gfm + @tailwindcss/typography
- **Chat segments model**: Text and tool call pills are interleaved inline (ContentSegment[] in ChatMessage.tsx)
- **Property cards**: Shown in a slide-over side panel (PropertyPanel.tsx), NOT inline in chat bubbles

## Environment files

- `.env` files are gitignored. Each service has a `.env.example` with placeholder values.
- `agent-service/.env` needs: `OPENROUTER_API_KEY`, `ASGARDEO_BASE_URL`, `MCP_SERVERS`
- `mcp-server/.env` needs: `ASGARDEO_BASE_URL`
- `web/.env` needs: `VITE_ASGARDEO_CLIENT_ID`, `VITE_ASGARDEO_BASE_URL`
- `insurance-api/` needs no env config

## Asgardeo org

- Org name: `erandisaorg`
- Base URL: `https://api.asgardeo.io/t/erandisaorg`

## GitHub

- Repo: `erandiganepola/property-search` (private)
- Remote: `origin`
