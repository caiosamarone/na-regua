import { AppointmentRepository } from "../gateways/appointment.repository";
import { AppointmentNotFoundError, AppointmentNotActionableError } from "../errors/booking-errors";

export class StaffCancelAppointmentUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(
    appointmentId: string,
    staffId: string,
    staffRole: string,
    barbershopId: string,
    reason?: string,
  ) {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment || appointment.barbershopId !== barbershopId)
      throw new AppointmentNotFoundError();

    if (staffRole === "BARBER" && appointment.barberId !== staffId)
      throw new AppointmentNotFoundError();

    if (appointment.status !== "BOOKED")
      throw new AppointmentNotActionableError();

    const now = new Date();

    return this.appointmentRepository.updateStatus(appointmentId, "CANCELLED", {
      cancelledById: staffId,
      cancelledByRole: staffRole as "BARBER" | "BARBERSHOP_ADMIN",
      cancellationReason: reason ?? null,
      cancelledAt: now,
    });
  }
}
