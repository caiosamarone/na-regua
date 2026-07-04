import { BarbershopRepository, OperatingHourInput } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError, OperatingHoursOverlapError } from "../errors/barbershop-errors";

export class ReplaceOperatingHoursUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(barbershopId: string, hours: OperatingHourInput[]) {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    const byDay: Record<number, Array<{ start: number; end: number }>> = {};
    for (const h of hours) {
      if (!byDay[h.dayOfWeek]) byDay[h.dayOfWeek] = [];
      const start = parseInt(h.startTime.replace(":", ""));
      const end = parseInt(h.endTime.replace(":", ""));
      if (start >= end) throw new OperatingHoursOverlapError("startTime deve ser menor que endTime");
      byDay[h.dayOfWeek].push({ start, end });
    }

    for (const day of Object.keys(byDay)) {
      const intervals = byDay[parseInt(day)].sort((a, b) => a.start - b.start);
      for (let i = 1; i < intervals.length; i++) {
        if (intervals[i].start < intervals[i - 1].end) {
          throw new OperatingHoursOverlapError();
        }
      }
    }

    await this.barbershopRepository.replaceOperatingHours(barbershopId, hours);
  }
}
