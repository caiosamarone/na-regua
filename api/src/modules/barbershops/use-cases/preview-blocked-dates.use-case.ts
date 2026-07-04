import { fromZonedTime } from "date-fns-tz";
import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

export class PreviewBlockedDatesUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(barbershopId: string, startDate: string, endDate: string) {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    const start = fromZonedTime(`${startDate}T00:00:00`, barbershop.timezone);
    const endOfLastDay = new Date(endDate);
    endOfLastDay.setDate(endOfLastDay.getDate() + 1);
    const endDateStr = endOfLastDay.toISOString().split("T")[0];
    const end = fromZonedTime(`${endDateStr}T00:00:00`, barbershop.timezone);

    const appointments = await this.barbershopRepository.findAppointmentsInRange(barbershopId, start, end);

    return appointments.map((apt) => ({
      id: apt.id,
      customerId: apt.customerId,
      customerName: apt.customer?.name ?? "Desconhecido",
      startTime: apt.startTime.toISOString(),
      serviceName: apt.service?.name ?? "Desconhecido",
    }));
  }
}
