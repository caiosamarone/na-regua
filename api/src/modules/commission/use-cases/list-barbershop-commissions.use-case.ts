import { CommissionRepository } from "../gateways/commission.repository";

export interface ListBarbershopCommissionsInput {
  barbershopId: string;
  barberId?: string;
  status?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export class ListBarbershopCommissionsUseCase {
  constructor(private commissionRepository: CommissionRepository) {}

  async execute(input: ListBarbershopCommissionsInput) {
    return this.commissionRepository.findBarbershopSummary(
      input.barbershopId,
      input.from,
      input.to,
      input.barberId,
      input.status as any,
      input.page,
      input.pageSize,
    );
  }
}
