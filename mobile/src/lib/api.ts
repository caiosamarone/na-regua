import { authStorage } from '@/lib/auth-storage';
import type { AuthTokens, Envelope } from '@/types/api';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333').replace(/\/+$/, '');

// Mirrors the API error format (ADR 005): { error, code, details }
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;
type RequestOptions = { method?: string; body?: unknown; query?: Query; auth?: boolean };

let onSessionExpired: (() => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

/** Called by the auth provider so a failed refresh sends the user back to login. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

function buildUrl(path: string, query?: Query) {
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${BASE_URL}${path}${params ? `?${params}` : ''}`;
}

async function send(path: string, { method = 'GET', body, query }: RequestOptions, token: string | null) {
  // Demo mode (src/mocks/config.ts): answered in memory. The env var is checked inline, not via MOCKS_ENABLED,
  // so the minifier can drop this branch and the whole mock server when the flag is off.
  if (process.env.EXPO_PUBLIC_USE_MOCKS === 'true') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockFetch } = require('@/mocks/server') as typeof import('@/mocks/server');
    return mockFetch(path, { method, body, query }, token);
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar. Verifique sua internet.');
  }
}

async function toError(res: Response) {
  const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string; details?: unknown };
  const fallback =
    res.status === 429 ? 'Muitas tentativas. Aguarde um pouco e tente de novo.' : 'Algo deu errado. Tente novamente.';
  return new ApiError(res.status, body.code ?? 'UNKNOWN', body.error ?? fallback, body.details);
}

// Refresh with rotation (ADR 002). Concurrent 401s share one refresh call.
function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) return null;
      const res = await send('/auth/refresh', { method: 'POST', body: { refreshToken } }, null);
      if (!res.ok) return null;
      const { data } = (await res.json()) as Envelope<AuthTokens>;
      await authStorage.setTokens(data);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth ?? true;
  const token = useAuth ? await authStorage.getAccessToken() : null;
  let res = await send(path, options, token);

  if (res.status === 401 && token) {
    const fresh = await refreshAccessToken();
    if (!fresh) {
      await authStorage.clear();
      onSessionExpired?.();
      throw await toError(res);
    }
    res = await send(path, options, fresh);
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(path, { ...options, method: 'POST', body: body ?? {} }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ?? {} }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  return error instanceof ApiError ? error.message : fallback;
}
