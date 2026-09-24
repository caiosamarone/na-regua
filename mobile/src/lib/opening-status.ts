import { hhmmToMinutes, shortHour, zonedParts } from '@/lib/format';
import type { OperatingHour } from '@/types/api';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export type OpeningStatus = { open: boolean; text: string };

/** "Aberta agora · fecha 18h" / "Fechada · abre amanhã 9h", computed in the shop timezone. */
export function openingStatus(hours: OperatingHour[], timeZone: string, now = new Date()): OpeningStatus {
  const { weekday, minutes } = zonedParts(now, timeZone);
  const byDay = (dow: number) =>
    hours.filter((h) => h.dayOfWeek === dow).sort((a, b) => hhmmToMinutes(a.startTime) - hhmmToMinutes(b.startTime));

  const current = byDay(weekday).find(
    (h) => hhmmToMinutes(h.startTime) <= minutes && minutes < hhmmToMinutes(h.endTime),
  );
  if (current) return { open: true, text: `Aberta agora · fecha ${shortHour(current.endTime)}` };

  const laterToday = byDay(weekday).find((h) => hhmmToMinutes(h.startTime) > minutes);
  if (laterToday) return { open: false, text: `Fechada · abre ${shortHour(laterToday.startTime)}` };

  for (let offset = 1; offset <= 7; offset++) {
    const dow = (weekday + offset) % 7;
    const first = byDay(dow)[0];
    if (first) {
      const when = offset === 1 ? 'amanhã' : WEEKDAYS[dow];
      return { open: false, text: `Fechada · abre ${when} ${shortHour(first.startTime)}` };
    }
  }
  return { open: false, text: 'Fechada' };
}
