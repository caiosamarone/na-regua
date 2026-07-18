import { CommissionRepository } from "../gateways/commission.repository";
import { CommissionAlreadyExistsError } from "../errors/commission-errors";

export class CreateCommissionEntryUseCase {
  constructor(private commissionRepository: CommissionRepository) {}

  async execute(
    barbershopId: string,
    staffMemberId: string,
    appointmentId: string,
    priceAtBooking: number,
    commissionPercent: number,
  ) {
    const existing = await this.commissionRepository.findByAppointmentId(appointmentId);
    if (existing) throw new CommissionAlreadyExistsError();

    if (!commissionPercent || commissionPercent <= 0) return null;

    const amount = (priceAtBooking * commissionPercent) / 100;

    return this.commissionRepository.createEntry({
      barbershopId,
      staffMemberId,
      appointmentId,
      commissionPercent,
      priceAtBooking,
      amount,
    });
  }
}
