import * as SecureStore from 'expo-secure-store';

import type { AuthTokens, CustomerPayload, StaffPayload } from '@/types/api';

// Tokens and the signed-in user live in the platform keychain/keystore (never AsyncStorage).
const ACCESS_KEY = 'naregua.accessToken';
const REFRESH_KEY = 'naregua.refreshToken';
const SESSION_KEY = 'naregua.session';

export type Session =
  | { kind: 'customer'; user: CustomerPayload }
  | { kind: 'staff'; user: StaffPayload & { role: 'BARBER' | 'BARBERSHOP_ADMIN'; barbershopId: string } };

export const authStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
  async setTokens({ accessToken, refreshToken }: AuthTokens) {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },
  async getSession(): Promise<Session | null> {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  },
  setSession: (session: Session) => SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session)),
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(SESSION_KEY),
    ]);
  },
};
