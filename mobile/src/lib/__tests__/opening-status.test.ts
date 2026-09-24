import { describe, expect, it } from '@jest/globals';

import { openingStatus } from '@/lib/opening-status';
import type { OperatingHour } from '@/types/api';

const SP = 'America/Sao_Paulo';
const weekdays: OperatingHour[] = [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
  { dayOfWeek, startTime: '08:00', endTime: '12:00' },
  { dayOfWeek, startTime: '13:00', endTime: '18:30' },
]);

// Thursday 24 Sep 2026 in São Paulo (UTC-3)
const at = (hhmm: string, day = 24) => new Date(`2026-09-${day}T${hhmm}:00-03:00`);

describe('openingStatus', () => {
  it('is open inside an interval and shows when it closes', () => {
    expect(openingStatus(weekdays, SP, at('10:40'))).toEqual({ open: true, text: 'Aberta agora · fecha 12h' });
    expect(openingStatus(weekdays, SP, at('14:00'))).toEqual({ open: true, text: 'Aberta agora · fecha 18h30' });
  });

  it('shows the next opening later today', () => {
    expect(openingStatus(weekdays, SP, at('12:30'))).toEqual({ open: false, text: 'Fechada · abre 13h' });
  });

  it('looks ahead to the next open day', () => {
    expect(openingStatus(weekdays, SP, at('19:00'))).toEqual({ open: false, text: 'Fechada · abre amanhã 8h' });
    // Friday night: next opening is Monday
    expect(openingStatus(weekdays, SP, at('19:00', 25))).toEqual({ open: false, text: 'Fechada · abre seg 8h' });
  });

  it('handles shops without hours', () => {
    expect(openingStatus([], SP, at('10:00'))).toEqual({ open: false, text: 'Fechada' });
  });
});
