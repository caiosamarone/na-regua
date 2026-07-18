import { CommissionRepository } from "../gateways/commission.repository";

export interface GetBarberCommissionsInput {
  staffMemberId: string;
  barbershopId: string;
  from?: Date;
  to?: Date;
  status?: string;
}

export class GetBarberCommissionsUseCase {
  constructor(private commissionRepository: CommissionRepository) {}

  async execute(input: GetBarberCommissionsInput) {
    const totals = await this.commissionRepository.getBarberTotals(
      input.staffMemberId,
      input.barbershopId,
    );

    const entries = await this.commissionRepository.findBarberEntries(
      input.staffMemberId,
      input.barbershopId,
      input.from,
      input.to,
      input.status as any,
    );

    return {
      commissionPercent: totals.commissionPercent,
      totalGenerated: totals.totalGenerated,
      pendingAmount: totals.pendingAmount,
      paidAmount: totals.paidAmount,
      entries: entries.map((e) => ({
        id: e.id,
        appointmentId: e.appointmentId,
        serviceName: e.appointment.service.name,
        customerName: e.appointment.customer.name,
        appointmentDate: e.appointment.startTime.toISOString(),
        amount: Number(e.amount),
        status: e.status,
        paidAt: e.paidAt ? e.paidAt.toISOString() : null,
        createdAt: e.createdAt,
      })),
    };
  }
}
