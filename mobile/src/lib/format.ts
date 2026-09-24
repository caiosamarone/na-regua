// Display helpers. Times are always shown in the barbershop's timezone (API ADR 010), never the device's.

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function brl(value: number) {
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
}

export function km(value: number) {
  return value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1).replace('.', ',')} km`;
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function minutesToHHmm(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function hhmmToMinutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

/** "18h" / "19h30" */
export function shortHour(hhmm: string) {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export type ZonedParts = { year: number; month: number; day: number; weekday: number; minutes: number };

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Wall-clock parts of an instant in the given IANA timezone. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, fmt);
  }
  const get = (type: string) => Number(fmt.formatToParts(date).find((p) => p.type === type)?.value);
  const year = get('year');
  const month = get('month');
  const day = get('day');
  // Weekday from the calendar date itself, so it does not depend on the device timezone.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, weekday, minutes: (get('hour') % 24) * 60 + get('minute') };
}

/** Calendar day in the shop timezone, as used by the API (YYYY-MM-DD). */
export type CalendarDay = { iso: string; year: number; month: number; day: number; weekday: number };

export function calendarDay(year: number, month: number, day: number): CalendarDay {
  const d = new Date(Date.UTC(year, month - 1, day));
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const dd = d.getUTCDate();
  return {
    iso: `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    year: y,
    month: m,
    day: dd,
    weekday: d.getUTCDay(),
  };
}

export function todayIn(timeZone: string, now = new Date()): CalendarDay {
  const p = zonedParts(now, timeZone);
  return calendarDay(p.year, p.month, p.day);
}

export function addDays(day: CalendarDay, amount: number): CalendarDay {
  return calendarDay(day.year, day.month, day.day + amount);
}

export function nextDays(timeZone: string, count: number, now = new Date()): CalendarDay[] {
  const today = todayIn(timeZone, now);
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

/** "Hoje" / "Amanhã" / "sex" relative to today in the shop timezone. */
export function dayLabel(day: CalendarDay, today: CalendarDay) {
  if (day.iso === today.iso) return 'Hoje';
  if (day.iso === addDays(today, 1).iso) return 'Amanhã';
  return WEEKDAYS[day.weekday];
}

export function monthShort(month: number) {
  return MONTHS[month - 1];
}

export function formatTime(iso: string, timeZone: string) {
  return minutesToHHmm(zonedParts(new Date(iso), timeZone).minutes);
}

export function dayOf(iso: string, timeZone: string): CalendarDay {
  const p = zonedParts(new Date(iso), timeZone);
  return calendarDay(p.year, p.month, p.day);
}

/** "Hoje, qui 24 set · 11:00" */
export function formatWhenLong(iso: string, timeZone: string, now = new Date()) {
  const day = dayOf(iso, timeZone);
  const label = dayLabel(day, todayIn(timeZone, now));
  const prefix = label === 'Hoje' || label === 'Amanhã' ? `${label}, ` : '';
  return `${prefix}${WEEKDAYS[day.weekday]} ${day.day} ${monthShort(day.month)} · ${formatTime(iso, timeZone)}`;
}

/** "12 set" */
export function formatShortDate(iso: string, timeZone: string) {
  const day = dayOf(iso, timeZone);
  return `${String(day.day).padStart(2, '0')} ${monthShort(day.month)}`;
}

/**
 * Converts a wall-clock time in the shop timezone to a UTC ISO instant.
 * Used only to build query ranges (from/to); slot instants always come from the API.
 */
export function zonedToUtcIso(day: CalendarDay, minutes: number, timeZone: string) {
  const guess = Date.UTC(day.year, day.month - 1, day.day, 0, minutes);
  const p = zonedParts(new Date(guess), timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, 0, p.minutes);
  return new Date(guess - (asUtc - guess)).toISOString();
}

export function isOpenDay(hours: { dayOfWeek: number }[], weekday: number) {
  return hours.some((h) => h.dayOfWeek === weekday);
}
