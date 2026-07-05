import { AppointmentRepository } from "../gateways/appointment.repository";
import { AppointmentNotFoundError } from "../errors/booking-errors";

export class GetCustomerAppointmentDetailUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(appointmentId: string, customerId: string) {
    const appointment = await this.appointmentRepository.findByIdWithRelations(appointmentId);
    if (!appointment || appointment.customerId !== customerId)
      throw new AppointmentNotFoundError();

    return appointment;
  }
}
