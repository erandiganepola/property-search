/**
 * APIM client credentials token provider.
 * Fetches and caches OAuth2 tokens from WSO2 API Manager.
 */

const APIM_TOKEN_URL = process.env.APIM_TOKEN_URL || "";
const APIM_CONSUMER_KEY = process.env.APIM_CONSUMER_KEY || "";
const APIM_CONSUMER_SECRET = process.env.APIM_CONSUMER_SECRET || "";

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix ms
}

let cached: CachedToken | null = null;

async function fetchToken(): Promise<CachedToken> {
  const credentials = Buffer.from(
    `${APIM_CONSUMER_KEY}:${APIM_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(APIM_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`APIM token request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  // Expire 60s early to avoid using a stale token
  const expiresAt = Date.now() + (data.expires_in - 60) * 1000;

  console.log(
    `[APIM] Token fetched — expires in ${data.expires_in}s`
  );

  return { accessToken: data.access_token, expiresAt };
}

/**
 * Returns a valid APIM access token, fetching or refreshing as needed.
 */
export async function getApimToken(): Promise<string> {
  if (!cached || Date.now() >= cached.expiresAt) {
    cached = await fetchToken();
  }
  return cached.accessToken;
}
