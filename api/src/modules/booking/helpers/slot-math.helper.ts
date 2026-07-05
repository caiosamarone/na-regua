import { fromZonedTime } from "date-fns-tz";
import { addMinutes } from "date-fns";

export interface OperatingInterval {
  startTime: string;
  endTime: string;
}

export interface BookedAppointment {
  startTime: Date;
  endTime: Date;
}

export interface Slot {
  startTimeLocal: string;
  startTimeUtc: Date;
  endTimeUtc: Date;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function composeLocal(dateStr: string, minutes: number, timezone: string): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${dateStr}T${h}:${m}:00`;
}

export function calculateSlots(
  dateStr: string,
  timezone: string,
  intervals: OperatingInterval[],
  duration: number,
  slotInterval: number,
  booked: BookedAppointment[],
): Slot[] {
  const slots: Slot[] = [];

  for (const interval of intervals) {
    const openMin = toMinutes(interval.startTime);
    const closeMin = toMinutes(interval.endTime);

    for (let m = openMin; m + duration <= closeMin; m += slotInterval) {
      const localStartStr = composeLocal(dateStr, m, timezone);
      const startUtc = fromZonedTime(localStartStr, timezone);
      const endUtc = addMinutes(startUtc, duration);

      const hasConflict = booked.some(
        (apt) => startUtc < apt.endTime && endUtc > apt.startTime,
      );

      if (!hasConflict) {
        slots.push({
          startTimeLocal: localStartStr,
          startTimeUtc: startUtc,
          endTimeUtc: endUtc,
        });
      }
    }
  }

  return slots;
}
