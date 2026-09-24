import { describe, expect, it } from '@jest/globals';

import {
  addDays,
  brl,
  dayLabel,
  formatTime,
  formatWhenLong,
  km,
  nextDays,
  todayIn,
  zonedParts,
  zonedToUtcIso,
} from '@/lib/format';

const SP = 'America/Sao_Paulo'; // UTC-3, no DST since 2019

describe('format', () => {
  it('formats money and distance in pt-BR', () => {
    expect(brl(18420)).toBe('R$ 18.420');
    expect(km(0.4)).toBe('400 m');
    expect(km(2.45)).toBe('2,5 km');
  });

  it('reads wall-clock parts in the shop timezone, not the device timezone', () => {
    // 2026-09-25 01:30 UTC is still Thursday 24 Sep 22:30 in São Paulo.
    const parts = zonedParts(new Date('2026-09-25T01:30:00Z'), SP);
    expect(parts).toEqual({ year: 2026, month: 9, day: 24, weekday: 4, minutes: 22 * 60 + 30 });
    expect(formatTime('2026-09-25T01:30:00Z', SP)).toBe('22:30');
  });

  it('labels today and tomorrow relative to the shop day', () => {
    const now = new Date('2026-09-24T13:40:00Z');
    const today = todayIn(SP, now);
    const [d0, d1, d2] = nextDays(SP, 3, now);
    expect(today.iso).toBe('2026-09-24');
    expect(dayLabel(d0, today)).toBe('Hoje');
    expect(dayLabel(d1, today)).toBe('Amanhã');
    expect(dayLabel(d2, today)).toBe('sáb');
    expect(addDays(today, 7).iso).toBe('2026-10-01');
  });

  it('builds the long confirmation date', () => {
    const now = new Date('2026-09-24T13:40:00Z');
    expect(formatWhenLong('2026-09-24T14:00:00Z', SP, now)).toBe('Hoje, qui 24 set · 11:00');
    expect(formatWhenLong('2026-09-29T18:00:00Z', SP, now)).toBe('ter 29 set · 15:00');
  });

  it('converts a shop-local midnight to the matching UTC instant', () => {
    expect(zonedToUtcIso(todayIn(SP, new Date('2026-09-24T12:00:00Z')), 0, SP)).toBe('2026-09-24T03:00:00.000Z');
  });
});
