import { AppointmentRepository } from "../gateways/appointment.repository";
import { AppointmentConflictError, InvalidSlotError, BarbershopNotActiveError } from "../errors/booking-errors";
import { addMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export class CreateAppointmentUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(data: {
    barbershopId: string;
    customerId: string;
    barberId: string;
    serviceId: string;
    startTime: string;
  }) {
    const barbershop = await this.appointmentRepository.findBarbershopById(data.barbershopId);
    if (!barbershop) throw new InvalidSlotError("Barbearia não encontrada");
    if (!barbershop.active) throw new BarbershopNotActiveError();

    const service = await this.appointmentRepository.findServiceById(data.serviceId);
    if (!service || !service.isActive) throw new InvalidSlotError("Serviço não encontrado ou inativo");

    const barber = await this.appointmentRepository.findStaffById(data.barberId);
    if (!barber || barber.barbershopId !== data.barbershopId)
      throw new InvalidSlotError("Profissional não encontrado");

    const startTime = new Date(data.startTime);
    const endTime = addMinutes(startTime, service.durationMinutes);

    const localTime = toZonedTime(startTime, barbershop.timezone);
    const localHour = localTime.getHours();
    const localMin = localTime.getMinutes();
    const localTotalMin = localHour * 60 + localMin;
    const dayOfWeek = localTime.getDay();

    const blockedDates = await this.appointmentRepository.findBlockedDates(barbershop.id, localTime);
    if (blockedDates.length > 0) throw new InvalidSlotError("Data bloqueada");

    const intervals = await this.appointmentRepository.findOperatingHours(barbershop.id, dayOfWeek);
    if (intervals.length === 0) throw new InvalidSlotError("Barbearia fechada neste dia");

    const isWithinOperatingHours = intervals.some((interval) => {
      const open = toMinutes(interval.startTime);
      const close = toMinutes(interval.endTime);
      return localTotalMin >= open && localTotalMin + service.durationMinutes <= close;
    });

    if (!isWithinOperatingHours) throw new InvalidSlotError("Fora do horário de funcionamento");

    if (barbershop.slotIntervalMinutes > 0 && localTotalMin % barbershop.slotIntervalMinutes !== 0) {
      throw new InvalidSlotError("Horário não respeita o intervalo de agendamento");
    }

    const conflict = await this.appointmentRepository.findBookedInRange(
      data.barberId,
      startTime,
      endTime,
    );

    if (conflict.length > 0) throw new AppointmentConflictError();

    return this.appointmentRepository.create({
      barbershopId: data.barbershopId,
      customerId: data.customerId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      serviceName: service.name,
      priceAtBooking: Number(service.price),
      durationAtBooking: service.durationMinutes,
      startTime,
      endTime,
    });
  }
}
