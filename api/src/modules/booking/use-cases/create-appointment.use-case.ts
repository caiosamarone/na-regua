import { AppointmentRepository } from "../gateways/appointment.repository";
import { AppointmentConflictError, InvalidSlotError, BarbershopNotActiveError } from "../errors/booking-errors";
import { addMinutes } from "date-fns";

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
