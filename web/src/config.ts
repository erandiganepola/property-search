// Runtime configuration. Reads from window.configs (populated by /config.js,
// which can be replaced by a deploy-time file mount on hosts like WSO2 Choreo)
// and falls back to Vite's compile-time VITE_* env vars for local dev.

declare global {
  interface Window {
    configs?: Record<string, string | undefined>;
  }
}

const get = (key: string, fallback = ""): string => {
  const fromWindow = window.configs?.[key];
  if (fromWindow) return fromWindow;
  const fromEnv = import.meta.env[`VITE_${key}`] as string | undefined;
  return fromEnv || fallback;
};

export const config = {
  asgardeoClientId: get("ASGARDEO_CLIENT_ID"),
  asgardeoBaseUrl: get("ASGARDEO_BASE_URL"),
  asgardeoSignInRedirectUrl: get(
    "ASGARDEO_SIGN_IN_REDIRECT_URL",
    "http://localhost:5173"
  ),
  asgardeoSignOutRedirectUrl: get(
    "ASGARDEO_SIGN_OUT_REDIRECT_URL",
    "http://localhost:5173"
  ),
  agentServiceUrl: get("AGENT_SERVICE_URL", "http://localhost:3002"),
};

export {};
