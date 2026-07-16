import { AppointmentRepository } from "../gateways/appointment.repository";
import {
  AppointmentNotFoundError,
  AppointmentNotActionableError,
  AppointmentNotYetStartedError,
} from "../errors/booking-errors";

export class MarkAppointmentDoneUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(appointmentId: string, staffId: string, staffRole: string, barbershopId: string) {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment || appointment.barbershopId !== barbershopId)
      throw new AppointmentNotFoundError();

    if (staffRole === "BARBER" && appointment.barberId !== staffId)
      throw new AppointmentNotFoundError();

    if (appointment.status !== "BOOKED")
      throw new AppointmentNotActionableError();

    const now = new Date();
    if (now < appointment.startTime)
      throw new AppointmentNotYetStartedError();

    return this.appointmentRepository.updateStatus(appointmentId, "DONE");
  }
}
