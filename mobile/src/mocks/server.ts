// In-memory stand-in for the API, used when EXPO_PUBLIC_USE_MOCKS=true (see src/mocks/config.ts).
// It mirrors the real routes, response shapes ({ data } / { error, code }) and main business rules
// closely enough to click through every screen. State resets when the app reloads.
import { MOCK_LATENCY_MS } from '@/mocks/config';
import {
  CLIENT_NAMES,
  DEMO_PASSWORD,
  GOOGLE_ACCOUNTS,
  HOME_SHOP_ID,
  HOURS,
  MOCK_TZ,
  SERVICES,
  SHOPS,
  STAFF,
  SUPER_ADMIN,
  type MockStaff,
} from '@/mocks/data';
import {
  addDays,
  calendarDay,
  dayOf,
  hhmmToMinutes,
  minutesToHHmm,
  todayIn,
  zonedToUtcIso,
  type CalendarDay,
} from '@/lib/format';
import type { Appointment, CustomerPayload, OperatingHour, Slot } from '@/types/api';

type Json = Record<string, unknown>;
type Query = Record<string, string | number | boolean | undefined | null>;
type Caller = { kind: 'customer' | 'staff'; id: string };
type Ctx = { method: string; params: string[]; query: Record<string, string>; body: Json; caller: Caller | null };
type Handler = (ctx: Ctx) => unknown;

class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const SLOT_INTERVAL = 30;
const CANCEL_WARNING = '50% do valor do serviço pode ser cobrado. Esta é uma simulação — nenhum pagamento será processado.';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type State = {
  staff: MockStaff[];
  services: typeof SERVICES;
  hours: OperatingHour[];
  passwords: Map<string, string>;
  customers: Map<string, CustomerPayload>;
  appointments: Appointment[];
  seq: number;
};

let state: State | null = null;

function db(): State {
  state ??= createState(new Date());
  return state;
}

/** Tests only: start again from the seed data. */
export function resetMockServer(now = new Date()) {
  state = createState(now);
}

function createState(now: Date): State {
  const s: State = {
    staff: STAFF.map((m) => ({ ...m })),
    services: SERVICES.map((v) => ({ ...v })),
    hours: HOURS.map((h) => ({ ...h })),
    passwords: new Map([...STAFF.map((m) => [m.email, DEMO_PASSWORD] as const), [SUPER_ADMIN.email, DEMO_PASSWORD]]),
    customers: new Map(GOOGLE_ACCOUNTS.map((c) => [c.id, { ...c }])),
    appointments: [],
    seq: 1,
  };
  seedAppointments(s, now);
  return s;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;
const intervalsOf = (hours: OperatingHour[], weekday: number) =>
  hours
    .filter((h) => h.dayOfWeek === weekday)
    .map((h) => [hhmmToMinutes(h.startTime), hhmmToMinutes(h.endTime)] as const)
    .sort((a, b) => a[0] - b[0]);

function makeAppointment(
  s: State,
  input: {
    shopId: string;
    barber: MockStaff;
    customer: CustomerPayload;
    service: (typeof SERVICES)[number];
    start: string;
    status: Appointment['status'];
    reason?: string;
  },
): Appointment {
  const startMs = new Date(input.start).getTime();
  const iso = new Date(startMs).toISOString();
  return {
    id: `appt-${s.seq++}`,
    barbershopId: input.shopId,
    customerId: input.customer.id,
    barberId: input.barber.id,
    serviceId: input.service.id,
    serviceName: input.service.name,
    priceAtBooking: input.service.price,
    durationAtBooking: input.service.durationMinutes,
    startTime: iso,
    endTime: new Date(startMs + input.service.durationMinutes * 60_000).toISOString(),
    status: input.status,
    cancellationReason: input.reason ?? null,
    barber: { id: input.barber.id, name: input.barber.name },
    customer: { ...input.customer },
    service: { name: input.service.name },
  };
}

function overlaps(s: State, barberId: string, startMs: number, endMs: number, statuses = ['BOOKED']) {
  return s.appointments.some(
    (a) =>
      a.barberId === barberId &&
      statuses.includes(a.status) &&
      new Date(a.startTime).getTime() < endMs &&
      new Date(a.endTime).getTime() > startMs,
  );
}

function nthOpenDay(s: State, from: CalendarDay, n: number) {
  let day = from;
  let found = 0;
  while (found < n) {
    day = addDays(day, 1);
    if (intervalsOf(s.hours, day.weekday).length) found++;
  }
  return day;
}

/** ~60 days of history plus the coming week, with the same "busy" pattern as the design prototype. */
function seedAppointments(s: State, now: Date) {
  const today = todayIn(MOCK_TZ, now);
  const byId = (id: string) => s.staff.find((m) => m.id === id)!;
  const svc = (id: string) => s.services.find((v) => v.id === id)!;
  const joao = s.customers.get('cust-joao')!;

  // João's own bookings (the customer demo account)
  const fixed = [
    { day: nthOpenDay(s, today, 1), t: '11:00', barber: 'staff-rafa', service: 'svc-2', shop: HOME_SHOP_ID, status: 'BOOKED' },
    { day: nthOpenDay(s, today, 4), t: '15:00', barber: 'staff-carlos', service: 'svc-3', shop: HOME_SHOP_ID, status: 'BOOKED' },
    { day: addDays(today, -12), t: '10:00', barber: 'staff-ze', service: 'svc-1', shop: HOME_SHOP_ID, status: 'DONE' },
    { day: addDays(today, -27), t: '10:00', barber: 'staff-rafa', service: 'svc-1', shop: 'shop-3', status: 'CANCELLED' },
  ] as const;
  fixed.forEach((f) =>
    s.appointments.push(
      makeAppointment(s, {
        shopId: f.shop,
        barber: byId(f.barber),
        customer: joao,
        service: svc(f.service),
        start: zonedToUtcIso(f.day, hhmmToMinutes(f.t), MOCK_TZ),
        status: f.status,
        reason: f.status === 'CANCELLED' ? 'Pedido do cliente' : undefined,
      }),
    ),
  );

  const barbers = ['staff-ze', 'staff-carlos', 'staff-rafa'].map(byId);
  const pattern = ['svc-1', 'svc-2', 'svc-1', 'svc-3', 'svc-1', 'svc-4'];
  for (let d = -60; d < 7; d++) {
    const day = addDays(today, d);
    barbers.forEach((barber, i) => {
      const bid = i + 1;
      for (const [open, close] of intervalsOf(s.hours, day.weekday)) {
        for (let t = open; t + SLOT_INTERVAL <= close; t += SLOT_INTERVAL) {
          // History ~40% busy (fills reports); the coming week ~20%, so booking still has free times.
          if (mod(bid * 7 + d * 13 + (t / 30) * 3, 5) >= (d < 0 ? 2 : 1)) continue;
          const service = svc(pattern[mod(t / 30 + d, pattern.length)]);
          if (t + service.durationMinutes > close) continue;
          const start = zonedToUtcIso(day, t, MOCK_TZ);
          const startMs = new Date(start).getTime();
          const endMs = startMs + service.durationMinutes * 60_000;
          if (overlaps(s, barber.id, startMs, endMs, ['BOOKED', 'DONE'])) continue;
          const cancelled = mod(bid + d + t / 30, 11) === 0;
          const name = CLIENT_NAMES[mod(t / 30 + d * 3, CLIENT_NAMES.length)];
          s.appointments.push(
            makeAppointment(s, {
              shopId: HOME_SHOP_ID,
              barber,
              customer: { id: `cust-${name.toLowerCase().replace(/\W+/g, '-')}`, name, email: 'cliente@email.com' },
              service,
              start,
              status: cancelled ? 'CANCELLED' : endMs <= now.getTime() ? 'DONE' : 'BOOKED',
              reason: cancelled ? 'Pedido do cliente' : undefined,
            }),
          );
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ok = (data: unknown) => ({ data });

function parseDay(iso: string | undefined): CalendarDay {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) throw new HttpError(400, 'VALIDATION_ERROR', 'Formato deve ser YYYY-MM-DD');
  return calendarDay(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** [from 00:00, to+1 00:00) in the shop timezone, as epoch ms. */
function dayRange(from: string, to: string) {
  return [
    new Date(zonedToUtcIso(parseDay(from), 0, MOCK_TZ)).getTime(),
    new Date(zonedToUtcIso(addDays(parseDay(to), 1), 0, MOCK_TZ)).getTime(),
  ] as const;
}

function requireCaller(ctx: Ctx, kind?: Caller['kind']) {
  if (!ctx.caller) throw new HttpError(401, 'UNAUTHORIZED', 'Token inválido ou ausente');
  if (kind && ctx.caller.kind !== kind) throw new HttpError(403, 'FORBIDDEN', 'Permissão insuficiente');
  return ctx.caller;
}

function requireStaff(ctx: Ctx, roles: MockStaff['role'][] = ['BARBER', 'BARBERSHOP_ADMIN']) {
  const caller = requireCaller(ctx, 'staff');
  const member = db().staff.find((m) => m.id === caller.id);
  if (!member || !roles.includes(member.role)) throw new HttpError(403, 'FORBIDDEN', 'Permissão insuficiente');
  return member;
}

function tokensFor(kind: Caller['kind'], id: string) {
  const nonce = Date.now().toString(36);
  return { accessToken: `mock.${kind}.${id}.${nonce}`, refreshToken: `mock-refresh.${kind}.${id}.${nonce}` };
}

function parseToken(token: string | null, prefix: 'mock' | 'mock-refresh'): Caller | null {
  const parts = token?.split('.') ?? [];
  if (parts[0] !== prefix || (parts[1] !== 'customer' && parts[1] !== 'staff') || !parts[2]) return null;
  return { kind: parts[1], id: parts[2] };
}

function findShop(id: string) {
  const shop = SHOPS.find((s) => s.id === id || slug(s.name) === id);
  if (!shop) throw new HttpError(404, 'BARBERSHOP_NOT_FOUND', 'Barbearia não encontrada');
  return shop;
}

const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function listItem(shop: (typeof SHOPS)[number], withDistance: boolean) {
  return {
    id: shop.id,
    name: shop.name,
    slug: slug(shop.name),
    address: shop.address,
    neighborhood: shop.neighborhood,
    city: 'São Paulo',
    state: 'SP',
    phone: null,
    logoUrl: null,
    latitude: null,
    longitude: null,
    distanceKm: withDistance ? shop.km : null,
  };
}

const staffJson = (m: MockStaff) => ({
  ...m,
  avatarUrl: null,
  createdAt: '2026-01-10T12:00:00.000Z',
  updatedAt: '2026-01-10T12:00:00.000Z',
});

function computeSlots(barberId: string, serviceId: string, date: string): Slot[] {
  const s = db();
  const service = s.services.find((v) => v.id === serviceId && v.isActive);
  if (!service) throw new HttpError(400, 'INVALID_SLOT', 'Serviço não encontrado ou inativo');
  const day = parseDay(date);
  const now = Date.now();
  const out: Slot[] = [];
  for (const [open, close] of intervalsOf(s.hours, day.weekday)) {
    for (let t = open; t + service.durationMinutes <= close; t += SLOT_INTERVAL) {
      const start = zonedToUtcIso(day, t, MOCK_TZ);
      const startMs = new Date(start).getTime();
      const endMs = startMs + service.durationMinutes * 60_000;
      if (startMs <= now || overlaps(s, barberId, startMs, endMs)) continue;
      out.push({ startTimeLocal: minutesToHHmm(t), startTimeUtc: start, endTimeUtc: new Date(endMs).toISOString() });
    }
  }
  return out;
}

function findAppointment(ctx: Ctx, id: string) {
  const caller = requireCaller(ctx);
  const a = db().appointments.find((x) => x.id === id);
  const visible =
    a &&
    (caller.kind === 'customer'
      ? a.customerId === caller.id
      : a.barbershopId === HOME_SHOP_ID &&
        (requireStaff(ctx).role === 'BARBERSHOP_ADMIN' || a.barberId === caller.id));
  if (!a || !visible) throw new HttpError(404, 'APPOINTMENT_NOT_FOUND', 'Agendamento não encontrado');
  return a;
}

function paginate(list: Appointment[], query: Record<string, string>) {
  const page = Number(query.page ?? 1);
  const pageSize = Math.min(Number(query.pageSize ?? 20), 100);
  const sorted = [...list].sort((a, b) => b.startTime.localeCompare(a.startTime));
  return { data: sorted.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, total: list.length } };
}

function filterAppointments(list: Appointment[], query: Record<string, string>) {
  return list.filter(
    (a) =>
      (!query.status || a.status === query.status) &&
      (!query.from || a.startTime >= new Date(query.from).toISOString()) &&
      (!query.to || a.startTime <= new Date(query.to).toISOString()),
  );
}

function assertShop(ctx: Ctx, shopId: string) {
  const member = requireStaff(ctx);
  if (shopId !== HOME_SHOP_ID) throw new HttpError(403, 'FORBIDDEN', 'Permissão insuficiente');
  return member;
}

// ---------------------------------------------------------------------------
// Routes (same paths as api/src/modules/*/*.routes.ts)
// ---------------------------------------------------------------------------

const routes: [string, string, Handler][] = [
  // --- auth
  [
    'POST',
    '/auth/google',
    ({ body }) => {
      const account = GOOGLE_ACCOUNTS.find((g) => body.idToken === `mock-google:${g.id}`);
      if (!account) throw new HttpError(401, 'UNAUTHORIZED', 'Token do Google inválido');
      return ok({ ...tokensFor('customer', account.id), customer: account });
    },
  ],
  [
    'POST',
    '/auth/magic-link',
    ({ body }) => {
      const email = String(body.email ?? '').toLowerCase();
      const s = db();
      if (![...s.customers.values()].some((c) => c.email === email)) {
        const id = `cust-${slug(email)}`;
        s.customers.set(id, { id, name: email.split('@')[0], email });
      }
      return ok({ message: 'Email sent if account exists' });
    },
  ],
  [
    'POST',
    '/auth/magic-link/verify',
    ({ body }) => {
      const email = String(body.token ?? '').replace(/^mock-magic:/, '');
      const customer = [...db().customers.values()].find((c) => `mock-magic:${c.email}` === body.token && c.email === email);
      if (!customer) throw new HttpError(401, 'MAGIC_LINK_INVALID', 'Magic link inválido ou expirado');
      return ok({ ...tokensFor('customer', customer.id), customer });
    },
  ],
  [
    'POST',
    '/auth/login',
    ({ body }) => {
      const s = db();
      const email = String(body.email ?? '').toLowerCase();
      if (s.passwords.get(email) !== body.password) throw new HttpError(401, 'UNAUTHORIZED', 'Credenciais inválidas');
      if (email === SUPER_ADMIN.email) {
        return ok({ ...tokensFor('staff', SUPER_ADMIN.id), staff: { ...SUPER_ADMIN, role: 'SUPER_ADMIN', barbershopId: null } });
      }
      const m = s.staff.find((x) => x.email === email && x.isActive);
      if (!m) throw new HttpError(401, 'UNAUTHORIZED', 'Credenciais inválidas');
      return ok({
        ...tokensFor('staff', m.id),
        staff: { id: m.id, name: m.name, email: m.email, role: m.role, barbershopId: HOME_SHOP_ID },
      });
    },
  ],
  [
    'POST',
    '/auth/refresh',
    ({ body }) => {
      const caller = parseToken(String(body.refreshToken ?? ''), 'mock-refresh');
      if (!caller) throw new HttpError(401, 'REFRESH_TOKEN_INVALID', 'Refresh token inválido ou expirado');
      return ok(tokensFor(caller.kind, caller.id));
    },
  ],
  ['POST', '/auth/logout', () => ok({ message: 'Logged out' })],
  ['POST', '/auth/forgot-password', () => ok({ message: 'OTP sent if account exists' })],
  [
    'POST',
    '/auth/reset-password',
    ({ body }) => {
      const s = db();
      const email = String(body.email ?? '').toLowerCase();
      // Demo: any 6-digit code works except 000000, which simulates a wrong code.
      if (!s.passwords.has(email) || !/^\d{6}$/.test(String(body.otp)) || body.otp === '000000') {
        throw new HttpError(400, 'OTP_INVALID', 'OTP inválido ou expirado');
      }
      s.passwords.set(email, String(body.newPassword));
      return ok({ message: 'Password updated' });
    },
  ],

  // --- barbershops (public)
  [
    'GET',
    '/barbershops/search',
    ({ query }) => {
      const withDistance = query.lat != null && query.lng != null && query.radiusKm != null;
      const radius = Number(query.radiusKm);
      const q = (query.q ?? '').toLowerCase();
      return ok(
        SHOPS.filter((s) => (!withDistance || s.km <= radius) && (!q || s.name.toLowerCase().includes(q))).map((s) =>
          listItem(s, withDistance),
        ),
      );
    },
  ],
  [
    'GET',
    '/barbershops/:id/slots',
    ({ params: [id], query }) => {
      findShop(id);
      if (!query.barberId) throw new HttpError(400, 'VALIDATION_ERROR', 'barberId é obrigatório no modo demo');
      return ok(computeSlots(query.barberId, query.serviceId ?? '', query.date ?? ''));
    },
  ],
  [
    'GET',
    '/barbershops/:id/services',
    (ctx) => {
      findShop(ctx.params[0]);
      const all = ctx.query.all === 'true';
      if (all) requireStaff(ctx, ['BARBERSHOP_ADMIN']);
      return ok(
        db()
          .services.filter((v) => all || v.isActive)
          .map((v) => ({ ...v, description: null, createdAt: '2026-01-10T12:00:00.000Z', updatedAt: '2026-01-10T12:00:00.000Z' })),
      );
    },
  ],
  [
    'GET',
    '/barbershops/:id',
    ({ params: [id] }) => {
      const s = db();
      const shop = findShop(id);
      return ok({
        ...listItem(shop, false),
        cep: '05435-000',
        timezone: MOCK_TZ,
        slotIntervalMinutes: SLOT_INTERVAL,
        cancellationLeadTimeMinutes: 180,
        active: true,
        primaryColor: null,
        secondaryColor: null,
        instagramUrl: null,
        whatsappUrl: null,
        facebookUrl: null,
        operatingHours: s.hours,
        services: s.services.filter((v) => v.isActive).map(({ isActive: _active, ...v }) => ({ ...v, description: null })),
        staff: s.staff
          .filter((m) => m.isBookable && m.isActive)
          .map((m) => ({ id: m.id, name: m.name, role: m.role, avatarUrl: null })),
        gallery: [],
      });
    },
  ],

  // --- booking
  [
    'POST',
    '/appointments',
    (ctx) => {
      const caller = requireCaller(ctx, 'customer');
      const s = db();
      const { barbershopId, barberId, serviceId, startTime } = ctx.body as Record<string, string>;
      findShop(barbershopId);
      const barber = s.staff.find((m) => m.id === barberId && m.isBookable && m.isActive);
      const service = s.services.find((v) => v.id === serviceId && v.isActive);
      if (!barber) throw new HttpError(400, 'INVALID_SLOT', 'Profissional não encontrado');
      if (!service) throw new HttpError(400, 'INVALID_SLOT', 'Serviço não encontrado ou inativo');
      const startIso = new Date(startTime).toISOString();
      const free = computeSlots(barberId, serviceId, dayOf(startIso, MOCK_TZ).iso).some((x) => x.startTimeUtc === startIso);
      if (!free) throw new HttpError(409, 'APPOINTMENT_CONFLICT', 'Conflito de horário');
      const appointment = makeAppointment(s, {
        shopId: barbershopId,
        barber,
        customer: s.customers.get(caller.id)!,
        service,
        start: startIso,
        status: 'BOOKED',
      });
      s.appointments.push(appointment);
      return ok(appointment);
    },
  ],
  [
    'GET',
    '/customers/me/appointments',
    (ctx) => {
      const caller = requireCaller(ctx, 'customer');
      return paginate(filterAppointments(db().appointments.filter((a) => a.customerId === caller.id), ctx.query), ctx.query);
    },
  ],
  ['GET', '/appointments/:id', (ctx) => ok(findAppointment(ctx, ctx.params[0]))],
  [
    'PATCH',
    '/appointments/:id/cancel',
    (ctx) => {
      const a = findAppointment(ctx, ctx.params[0]);
      if (a.status !== 'BOOKED') throw new HttpError(409, 'APPOINTMENT_NOT_ACTIONABLE', 'Agendamento não pode ser alterado');
      a.status = 'CANCELLED';
      a.cancellationReason = typeof ctx.body.reason === 'string' ? ctx.body.reason : null;
      const late = new Date(a.startTime).getTime() - Date.now() < 180 * 60_000;
      return ok(ctx.caller?.kind === 'customer' && late ? { ...a, warning: CANCEL_WARNING } : a);
    },
  ],
  [
    'PATCH',
    '/appointments/:id/done',
    (ctx) => {
      requireStaff(ctx);
      const a = findAppointment(ctx, ctx.params[0]);
      if (a.status !== 'BOOKED') throw new HttpError(409, 'APPOINTMENT_NOT_ACTIONABLE', 'Agendamento não pode ser alterado');
      if (Date.now() < new Date(a.startTime).getTime()) {
        throw new HttpError(400, 'APPOINTMENT_NOT_YET_STARTED', 'Agendamento ainda não iniciado');
      }
      a.status = 'DONE';
      return ok(a);
    },
  ],
  [
    'GET',
    '/barbershops/:id/appointments',
    (ctx) => {
      const member = assertShop(ctx, ctx.params[0]);
      const barberId = member.role === 'BARBER' ? member.id : ctx.query.barberId;
      const list = db().appointments.filter((a) => a.barbershopId === HOME_SHOP_ID && (!barberId || a.barberId === barberId));
      return paginate(filterAppointments(list, ctx.query), ctx.query);
    },
  ],

  // --- commissions & metrics
  [
    'GET',
    '/staff/me/commissions',
    (ctx) => {
      const member = requireStaff(ctx);
      const pct = member.commissionPercent;
      const today = todayIn(MOCK_TZ).iso;
      const [from, to] = dayRange(ctx.query.from ?? '2000-01-01', ctx.query.to ?? today);
      const done = db().appointments.filter((a) => a.barberId === member.id && a.status === 'DONE');
      const entries =
        pct == null
          ? []
          : done
              .filter((a) => {
                const t = new Date(a.startTime).getTime();
                return t >= from && t < to;
              })
              .map((a) => ({
                id: `comm-${a.id}`,
                appointmentId: a.id,
                serviceName: a.serviceName,
                customerName: a.customer?.name ?? 'Cliente',
                appointmentDate: a.startTime,
                amount: (a.priceAtBooking * pct) / 100,
                status: 'PENDING',
                paidAt: null,
                createdAt: a.endTime,
              }));
      const total = pct == null ? 0 : done.reduce((sum, a) => sum + (a.priceAtBooking * pct) / 100, 0);
      return ok({ commissionPercent: pct, totalGenerated: total, pendingAmount: total, paidAmount: 0, entries });
    },
  ],
  [
    'GET',
    '/barbershops/:id/metrics',
    (ctx) => {
      requireStaff(ctx, ['BARBERSHOP_ADMIN']);
      assertShop(ctx, ctx.params[0]);
      const [from, to] = dayRange(ctx.query.from ?? '', ctx.query.to ?? '');
      const done = db().appointments.filter((a) => {
        const t = new Date(a.startTime).getTime();
        return a.barbershopId === HOME_SHOP_ID && a.status === 'DONE' && t >= from && t < to;
      });
      const group = <K extends string>(key: (a: Appointment) => K) => {
        const map = new Map<K, { count: number; revenue: number }>();
        done.forEach((a) => {
          const g = map.get(key(a)) ?? { count: 0, revenue: 0 };
          g.count++;
          g.revenue += a.priceAtBooking;
          map.set(key(a), g);
        });
        return [...map.entries()].sort((x, y) => y[1].count - x[1].count).slice(0, 10);
      };
      return ok({
        totalRevenue: done.reduce((sum, a) => sum + a.priceAtBooking, 0),
        topServices: group((a) => a.serviceName).map(([serviceName, g]) => ({
          serviceName,
          bookingCount: g.count,
          revenue: g.revenue,
        })),
        topBarbers: group((a) => a.barberId)
          .sort((x, y) => y[1].revenue - x[1].revenue)
          .map(([barberId, g]) => ({ barberId, appointmentCount: g.count, revenue: g.revenue })),
        busiestDays: group((a) => dayOf(a.startTime, MOCK_TZ).iso).map(([date, g]) => ({
          date,
          appointmentCount: g.count,
        })),
      });
    },
  ],

  // --- admin: staff, services, hours
  [
    'GET',
    '/barbershops/:id/staff',
    (ctx) => {
      requireStaff(ctx, ['BARBERSHOP_ADMIN']);
      assertShop(ctx, ctx.params[0]);
      return ok(db().staff.filter((m) => ctx.query.all === 'true' || m.isActive).map(staffJson));
    },
  ],
  [
    'POST',
    '/barbershops/:id/staff',
    (ctx) => {
      requireStaff(ctx, ['BARBERSHOP_ADMIN']);
      assertShop(ctx, ctx.params[0]);
      const email = String(ctx.body.email ?? '').toLowerCase();
      if (db().staff.some((m) => m.email === email)) throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'Email já cadastrado');
      // Like the API: the member only shows up after accepting the invite.
      return ok({ message: 'Invite sent' });
    },
  ],
  [
    'PATCH',
    '/staff/:id',
    (ctx) => {
      requireStaff(ctx, ['BARBERSHOP_ADMIN']);
      const m = db().staff.find((x) => x.id === ctx.params[0]);
      if (!m) throw new HttpError(404, 'STAFF_NOT_FOUND', 'Profissional não encontrado');
      const { isBookable, commissionPercent, isActive, name } = ctx.body;
      if (typeof isBookable === 'boolean') m.isBookable = isBookable;
      if (typeof isActive === 'boolean') m.isActive = isActive;
      if (typeof name === 'string') m.name = name;
      if (typeof commissionPercent === 'number' || commissionPercent === null) m.commissionPercent = commissionPercent;
      return ok(staffJson(m));
    },
  ],
  [
    'PATCH',
    '/services/:id',
    (ctx) => {
      requireStaff(ctx, ['BARBERSHOP_ADMIN']);
      const v = db().services.find((x) => x.id === ctx.params[0]);
      if (!v) throw new HttpError(404, 'SERVICE_NOT_FOUND', 'Serviço não encontrado');
      const { price, durationMinutes } = ctx.body;
      if (typeof price === 'number') v.price = price;
      if (typeof durationMinutes === 'number') {
        if (durationMinutes < 5 || durationMinutes > 480) throw new HttpError(400, 'VALIDATION_ERROR', 'Duração inválida');
        v.durationMinutes = durationMinutes;
      }
      return ok(v);
    },
  ],
  [
    'DELETE',
    '/services/:id',
    (ctx) => {
      requireStaff(ctx, ['BARBERSHOP_ADMIN']);
      const v = db().services.find((x) => x.id === ctx.params[0]);
      if (!v) throw new HttpError(404, 'SERVICE_NOT_FOUND', 'Serviço não encontrado');
      v.isActive = false;
      return ok({ message: 'Service deactivated' });
    },
  ],
  [
    'PUT',
    '/barbershops/:id/operating-hours',
    (ctx) => {
      requireStaff(ctx, ['BARBERSHOP_ADMIN']);
      assertShop(ctx, ctx.params[0]);
      const hours = (ctx.body as unknown as OperatingHour[]) ?? [];
      if (!Array.isArray(hours) || hours.length === 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Pelo menos um horário deve ser enviado');
      }
      db().hours = hours.map((h) => ({ ...h }));
      return ok(db().hours);
    },
  ],
];

function match(method: string, path: string) {
  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue;
    const re = new RegExp(`^${pattern.replace(/:[a-zA-Z]+/g, '([^/]+)')}$`);
    const found = re.exec(path);
    if (found) return { handler, params: found.slice(1).map(decodeURIComponent) };
  }
  return null;
}

/** Answers a request like the API would. Returns a minimal Response for the api client. */
export async function mockFetch(
  path: string,
  { method = 'GET', body, query }: { method?: string; body?: unknown; query?: Query },
  token: string | null,
): Promise<Response> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  const respond = (status: number, payload: unknown) =>
    ({ ok: status >= 200 && status < 300, status, json: async () => payload }) as Response;

  const route = match(method, path);
  if (!route) return respond(404, { error: `Rota não simulada: ${method} ${path}`, code: 'NOT_FOUND' });

  const stringQuery = Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  );
  try {
    const result = route.handler({
      method,
      params: route.params,
      query: stringQuery,
      body: (body ?? {}) as Json,
      caller: parseToken(token, 'mock'),
    });
    // Return copies so screens never mutate the mock state by accident.
    return respond(200, JSON.parse(JSON.stringify(result)));
  } catch (error) {
    if (error instanceof HttpError) return respond(error.status, { error: error.message, code: error.code });
    return respond(500, { error: 'Erro interno no mock', code: 'INTERNAL_ERROR' });
  }
}
