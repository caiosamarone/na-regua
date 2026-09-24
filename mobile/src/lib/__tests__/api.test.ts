import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => mockStore.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    mockStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    mockStore.delete(key);
  },
}));

// eslint-disable-next-line import/first
import { api, ApiError, setSessionExpiredHandler } from '@/lib/api';
// eslint-disable-next-line import/first
import { authStorage } from '@/lib/auth-storage';

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];

function respond(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function mockFetch(handler: (url: string, init: RequestInit) => Response) {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init: init ?? {} });
    return handler(url, init ?? {});
  }) as typeof fetch;
}

const authHeader = (c: Call) => (c.init.headers as Record<string, string>).Authorization;

describe('api client', () => {
  beforeEach(async () => {
    mockStore.clear();
    calls.length = 0;
    await authStorage.setTokens({ accessToken: 'old-access', refreshToken: 'old-refresh' });
  });

  afterEach(() => setSessionExpiredHandler(null));

  it('sends the bearer token and unwraps nothing (callers read { data })', async () => {
    mockFetch(() => respond(200, { data: [1, 2] }));
    await expect(api.get('/customers/me/appointments', { pageSize: 100, status: undefined })).resolves.toEqual({
      data: [1, 2],
    });
    expect(calls[0].url).toMatch(/\/customers\/me\/appointments\?pageSize=100$/);
    expect(authHeader(calls[0])).toBe('Bearer old-access');
  });

  it('maps the API error format to ApiError', async () => {
    mockFetch(() => respond(409, { error: 'Horário indisponível', code: 'SLOT_TAKEN' }));
    const error = await api.post('/appointments', {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'SLOT_TAKEN', message: 'Horário indisponível' });
  });

  it('refreshes once on 401, stores the rotated tokens and retries', async () => {
    mockFetch((url, init) => {
      if (url.endsWith('/auth/refresh')) {
        expect(JSON.parse(String(init.body))).toEqual({ refreshToken: 'old-refresh' });
        return respond(200, { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
      }
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer new-access' ? respond(200, { data: 'ok' }) : respond(401, { code: 'UNAUTHORIZED' });
    });

    await expect(api.get('/staff/me/commissions')).resolves.toEqual({ data: 'ok' });
    expect(calls.map((c) => c.url.replace(/^.*:\d+/, ''))).toEqual([
      '/staff/me/commissions',
      '/auth/refresh',
      '/staff/me/commissions',
    ]);
    await expect(authStorage.getRefreshToken()).resolves.toBe('new-refresh');
  });

  it('clears the session when the refresh fails', async () => {
    const expired = jest.fn();
    setSessionExpiredHandler(expired);
    mockFetch((url) =>
      url.endsWith('/auth/refresh') ? respond(401, { code: 'REFRESH_TOKEN_INVALID' }) : respond(401, {}),
    );

    await expect(api.get('/customers/me/appointments')).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledTimes(1);
    await expect(authStorage.getAccessToken()).resolves.toBeNull();
  });

  it('turns network failures into a friendly error', async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;
    await expect(api.get('/barbershops/search')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
