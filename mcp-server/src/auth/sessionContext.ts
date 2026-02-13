export interface SessionUser {
  userId: string;
  clientId: string;
}

// Keyed by clientId (from token verifier)
const sessions = new Map<string, SessionUser>();

export function setSessionUser(clientId: string, user: SessionUser): void {
  sessions.set(clientId, user);
}

export function getSessionUser(clientId: string): SessionUser | undefined {
  return sessions.get(clientId);
}
