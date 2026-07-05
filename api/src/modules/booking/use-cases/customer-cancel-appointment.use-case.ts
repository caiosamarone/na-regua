import { AppointmentRepository } from "../gateways/appointment.repository";
import { AppointmentNotFoundError, AppointmentNotActionableError } from "../errors/booking-errors";

export class CustomerCancelAppointmentUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(appointmentId: string, customerId: string, reason?: string) {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment || appointment.customerId !== customerId)
      throw new AppointmentNotFoundError();

    if (appointment.status !== "BOOKED")
      throw new AppointmentNotActionableError();

    const now = new Date();
    const leadTimeMs = appointment.startTime.getTime() - now.getTime();
    const barbershop = await this.appointmentRepository.findBarbershopById(appointment.barbershopId);
    const cancellationLeadTimeMs = (barbershop?.cancellationLeadTimeMinutes ?? 180) * 60 * 1000;

    const result = await this.appointmentRepository.updateStatus(appointmentId, "CANCELLED", {
      cancelledById: customerId,
      cancelledByRole: "CUSTOMER",
      cancellationReason: reason ?? null,
      cancelledAt: now,
    });

    const warning =
      leadTimeMs < cancellationLeadTimeMs
        ? "50% do valor do serviço pode ser cobrado. Esta é uma simulação — nenhum pagamento será processado."
        : undefined;

    return { appointment: result, warning };
  }
}
