import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setSessionExpiredHandler } from '@/lib/api';
import { authStorage, type Session } from '@/lib/auth-storage';
import { signOutFromGoogle } from '@/lib/google-sign-in';
import type { AuthTokens } from '@/types/api';

type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  session: Session | null;
  signIn: (tokens: AuthTokens, session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [session, setSession] = useState<Session | null>(null);

  const reset = useCallback(() => {
    setSession(null);
    setStatus('signedOut');
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, refreshToken] = await Promise.all([authStorage.getSession(), authStorage.getRefreshToken()]);
      if (cancelled) return;
      if (stored && refreshToken) {
        setSession(stored);
        setStatus('signedIn');
      } else {
        await authStorage.clear();
        setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(reset);
    return () => setSessionExpiredHandler(null);
  }, [reset]);

  const signIn = useCallback(async (tokens: AuthTokens, next: Session) => {
    await authStorage.setTokens(tokens);
    await authStorage.setSession(next);
    setSession(next);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = await authStorage.getRefreshToken();
    if (refreshToken) {
      // Best effort: revoke the refresh token on the server; local logout happens regardless.
      await api.post('/auth/logout', { refreshToken }, { auth: false }).catch(() => undefined);
    }
    await signOutFromGoogle();
    await authStorage.clear();
    reset();
  }, [reset]);

  const value = useMemo(() => ({ status, session, signIn, signOut }), [status, session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Session of a signed-in staff member. Only call from screens under the (staff) group. */
export function useStaffSession() {
  const { session } = useAuth();
  if (session?.kind !== 'staff') throw new Error('useStaffSession requires a staff session');
  return session.user;
}
