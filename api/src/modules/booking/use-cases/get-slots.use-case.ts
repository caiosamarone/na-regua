import { fromZonedTime } from "date-fns-tz";
import { AppointmentRepository } from "../gateways/appointment.repository";
import { calculateSlots } from "../helpers/slot-math.helper";
import { InvalidSlotError, BarbershopNotActiveError } from "../errors/booking-errors";
import { toZonedTime } from "date-fns-tz";

export class GetSlotsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(barbershopId: string, serviceId: string, dateStr: string, barberId?: string) {
    const barbershop = await this.appointmentRepository.findBarbershopById(barbershopId);
    if (!barbershop) throw new InvalidSlotError("Barbearia não encontrada");
    if (!barbershop.active) throw new BarbershopNotActiveError();

    const service = await this.appointmentRepository.findServiceById(serviceId);
    if (!service || !service.isActive) throw new InvalidSlotError("Serviço não encontrado ou inativo");

    const localMidday = toZonedTime(`${dateStr}T12:00:00`, barbershop.timezone);
    const dayOfWeek = localMidday.getDay();

    const blockedDates = await this.appointmentRepository.findBlockedDates(barbershopId, localMidday);
    if (blockedDates.length > 0) return [];

    const intervals = await this.appointmentRepository.findOperatingHours(barbershopId, dayOfWeek);
    if (intervals.length === 0) return [];

    const startOfDayUtc = new Date(`${dateStr}T00:00:00Z`);
    const endOfDayUtc = new Date(`${dateStr}T23:59:59Z`);

    const booked = barberId
      ? await this.appointmentRepository.findBookedInRange(barberId, startOfDayUtc, endOfDayUtc)
      : [];

    const timeOffBlocks = barberId
      ? await this.getTimeOffBlocks(barberId, dateStr, barbershop.timezone, startOfDayUtc, endOfDayUtc)
      : [];

    if (timeOffBlocks.some((b) => b === "FULL_DAY")) return [];

    return calculateSlots(
      dateStr,
      barbershop.timezone,
      intervals.map((i) => ({ startTime: i.startTime, endTime: i.endTime })),
      service.durationMinutes,
      barbershop.slotIntervalMinutes,
      [...booked.map((a) => ({ startTime: a.startTime, endTime: a.endTime })), ...timeOffBlocks.filter((b) => b !== "FULL_DAY") as { startTime: Date; endTime: Date }[]],
    );
  }

  private async getTimeOffBlocks(
    barberId: string,
    dateStr: string,
    timezone: string,
    startOfDayUtc: Date,
    endOfDayUtc: Date,
  ): Promise<({ startTime: Date; endTime: Date } | "FULL_DAY")[]> {
    const timeOffs = await this.appointmentRepository.findTimeOffInRange(barberId, startOfDayUtc, endOfDayUtc);
    if (timeOffs.length === 0) return [];

    const blocks: ({ startTime: Date; endTime: Date } | "FULL_DAY")[] = [];

    for (const to of timeOffs) {
      if (!to.startTime || !to.endTime) {
        return ["FULL_DAY"];
      }
      blocks.push({
        startTime: fromZonedTime(`${dateStr}T${to.startTime}:00`, timezone),
        endTime: fromZonedTime(`${dateStr}T${to.endTime}:00`, timezone),
      });
    }

    return blocks;
  }
}
