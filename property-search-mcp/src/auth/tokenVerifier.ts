import { createRemoteJWKSet, jwtVerify } from "jose";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { setSessionUser } from "./sessionContext.js";

export function createAsgardeoTokenVerifier(asgardeoBaseUrl: string): OAuthTokenVerifier {
  const jwksUrl = new URL(`${asgardeoBaseUrl}/oauth2/jwks`);
  const JWKS = createRemoteJWKSet(jwksUrl);
  const expectedIssuer = `${asgardeoBaseUrl}/oauth2/token`;

  return {
    async verifyAccessToken(token: string): Promise<AuthInfo> {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: expectedIssuer,
      });

      // Asgardeo puts scopes in the "scope" claim as a space-separated string
      const scopeStr = (payload.scope as string) || "";
      const scopes = scopeStr.split(" ").filter(Boolean);

      const clientId =
        (payload.client_id as string) ||
        (payload.azp as string) ||
        "unknown";

      const userId = (payload.sub as string) || clientId;

      // Store session context for tool handlers to look up
      setSessionUser(clientId, { userId, clientId });

      return {
        token,
        clientId,
        scopes,
        expiresAt: payload.exp,
      };
    },
  };
}
