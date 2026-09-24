// Web build (used for demos/recordings): expo-secure-store has no web support, and tokens must not go
// to localStorage, so the session lives in memory only and ends when the page reloads.
import type { Session } from '@/lib/auth-storage';
import type { AuthTokens } from '@/types/api';

const memory = new Map<string, string>();

export type { Session };

export const authStorage = {
  getAccessToken: async () => memory.get('accessToken') ?? null,
  getRefreshToken: async () => memory.get('refreshToken') ?? null,
  async setTokens({ accessToken, refreshToken }: AuthTokens) {
    memory.set('accessToken', accessToken);
    memory.set('refreshToken', refreshToken);
  },
  async getSession(): Promise<Session | null> {
    const raw = memory.get('session');
    return raw ? (JSON.parse(raw) as Session) : null;
  },
  async setSession(session: Session) {
    memory.set('session', JSON.stringify(session));
  },
  async clear() {
    memory.clear();
  },
};
