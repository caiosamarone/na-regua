import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { formatTime, nextDays } from '@/lib/format';
import { MOCK_TZ } from '@/mocks/data';
import { mockFetch, resetMockServer } from '@/mocks/server';

jest.mock('@/mocks/config', () => ({ MOCKS_ENABLED: true, MOCK_LATENCY_MS: 0 }));

type Body<T = unknown> = { data: T; error?: string; code?: string };

async function call<T = unknown>(method: string, path: string, opts: { body?: unknown; query?: Record<string, string>; token?: string | null } = {}) {
  const res = await mockFetch(path, { method, body: opts.body, query: opts.query }, opts.token ?? null);
  return { status: res.status, body: (await res.json()) as Body<T> };
}

async function login(email: string) {
  const { body } = await call<{ accessToken: string }>('POST', '/auth/login', { body: { email, password: 'admin123' } });
  return body.data.accessToken;
}

describe('mock server', () => {
  beforeEach(() => resetMockServer());

  it('logs in the fake Google user', async () => {
    const { status, body } = await call<{ customer: { name: string } }>('POST', '/auth/google', {
      body: { idToken: 'mock-google:cust-joao' },
    });
    expect(status).toBe(200);
    expect(body.data.customer.name).toBe('João Silva');
  });

  it('rejects wrong staff credentials with the API error format', async () => {
    const { status, body } = await call('POST', '/auth/login', { body: { email: 'ze@barbearia.com', password: 'errada12' } });
    expect(status).toBe(401);
    expect(body).toEqual({ error: 'Credenciais inválidas', code: 'UNAUTHORIZED' });
  });

  it('books a free slot, which then disappears from the list', async () => {
    const token = (await call<{ accessToken: string }>('POST', '/auth/google', { body: { idToken: 'mock-google:cust-joao' } }))
      .body.data.accessToken;
    // Find the first day in the coming week that still has a free slot for Carlos
    let slot: { startTimeUtc: string } | undefined;
    let date = '';
    for (const day of nextDays(MOCK_TZ, 7)) {
      const { body } = await call<{ startTimeUtc: string }[]>('GET', '/barbershops/shop-1/slots', {
        query: { barberId: 'staff-carlos', serviceId: 'svc-1', date: day.iso },
      });
      if (body.data.length) {
        slot = body.data[0];
        date = day.iso;
        break;
      }
    }
    expect(slot).toBeDefined();

    const booked = await call<{ id: string; startTime: string }>('POST', '/appointments', {
      token,
      body: { barbershopId: 'shop-1', barberId: 'staff-carlos', serviceId: 'svc-1', startTime: slot!.startTimeUtc },
    });
    expect(booked.status).toBe(200);
    expect(formatTime(booked.body.data.startTime, MOCK_TZ)).toMatch(/^\d{2}:\d{2}$/);

    const after = await call<{ startTimeUtc: string }[]>('GET', '/barbershops/shop-1/slots', {
      query: { barberId: 'staff-carlos', serviceId: 'svc-1', date },
    });
    expect(after.body.data.some((s) => s.startTimeUtc === slot!.startTimeUtc)).toBe(false);

    const again = await call('POST', '/appointments', {
      token,
      body: { barbershopId: 'shop-1', barberId: 'staff-carlos', serviceId: 'svc-1', startTime: slot!.startTimeUtc },
    });
    expect(again.status).toBe(409);
  });

  it('only shows a barber their own appointments', async () => {
    const token = await login('carlos@barbearia.com');
    const { body } = await call<{ barberId: string }[]>('GET', '/barbershops/shop-1/appointments', {
      token,
      query: { barberId: 'staff-ze', pageSize: '100' },
    });
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((a) => a.barberId === 'staff-carlos')).toBe(true);
  });

  it('keeps admin-only routes away from barbers', async () => {
    const token = await login('carlos@barbearia.com');
    const { status } = await call('GET', '/barbershops/shop-1/staff', { token, query: { all: 'true' } });
    expect(status).toBe(403);
  });

  it('answers unknown routes with 404 instead of crashing', async () => {
    const { status, body } = await call('GET', '/nao-existe');
    expect(status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
  });
});
