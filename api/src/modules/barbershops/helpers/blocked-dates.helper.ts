import { toZonedTime } from "date-fns-tz";
import { BlockedDatesInPastError } from "../errors/barbershop-errors";

export function validateStartDateNotInPast(startDate: string, timezone: string): void {
  const nowInTz = toZonedTime(new Date(), timezone);
  const year = nowInTz.getFullYear();
  const month = String(nowInTz.getMonth() + 1).padStart(2, "0");
  const day = String(nowInTz.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  if (startDate < todayStr) {
    throw new BlockedDatesInPastError();
  }
}
