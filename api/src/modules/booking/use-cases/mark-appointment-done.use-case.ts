import { AppointmentRepository } from "../gateways/appointment.repository";
import type { StaffRepository } from "../../staff/gateways/staff.repository";
import { CreateCommissionEntryUseCase } from "../../commission/use-cases/create-commission-entry.use-case";
import type { CommissionRepository } from "../../commission/gateways/commission.repository";
import {
  AppointmentNotFoundError,
  AppointmentNotActionableError,
  AppointmentNotYetStartedError,
} from "../errors/booking-errors";

export class MarkAppointmentDoneUseCase {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private staffRepository?: StaffRepository,
    private commissionRepository?: CommissionRepository,
  ) {}

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

    const result = await this.appointmentRepository.updateStatus(appointmentId, "DONE");

    if (this.staffRepository && this.commissionRepository) {
      const barber = await this.staffRepository.findById(appointment.barberId);
      if (barber?.commissionPercent && Number(barber.commissionPercent) > 0) {
        const createCommission = new CreateCommissionEntryUseCase(this.commissionRepository);
        await createCommission.execute(
          barbershopId,
          appointment.barberId,
          appointment.id,
          Number(appointment.priceAtBooking),
          Number(barber.commissionPercent),
        );
      }
    }

    return result;
  }
}
