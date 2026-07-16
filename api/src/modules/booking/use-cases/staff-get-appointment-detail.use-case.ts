import { AppointmentRepository } from "../gateways/appointment.repository";
import { AppointmentNotFoundError } from "../errors/booking-errors";

export class StaffGetAppointmentDetailUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(appointmentId: string, staffId: string, staffRole: string, barbershopId: string) {
    const appointment = await this.appointmentRepository.findByIdWithRelations(appointmentId);
    if (!appointment || appointment.barbershopId !== barbershopId)
      throw new AppointmentNotFoundError();

    if (staffRole === "BARBER" && appointment.barberId !== staffId)
      throw new AppointmentNotFoundError();

    return appointment;
  }
}
