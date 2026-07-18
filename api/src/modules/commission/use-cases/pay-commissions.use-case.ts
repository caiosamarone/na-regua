import { CommissionRepository } from "../gateways/commission.repository";
import {
  InvalidPayInputError,
  NoPendingCommissionsError,
} from "../errors/commission-errors";

export interface PayCommissionsInput {
  barbershopId: string;
  staffMemberId?: string;
  payAll?: boolean;
  note?: string;
}

export class PayCommissionsUseCase {
  constructor(private commissionRepository: CommissionRepository) {}

  async execute(input: PayCommissionsInput) {
    if (!input.staffMemberId && !input.payAll) {
      throw new InvalidPayInputError();
    }

    const staffMemberId = input.payAll ? undefined : input.staffMemberId;

    const pendingEntries = await this.commissionRepository.findPendingByBarber(
      input.barbershopId,
      staffMemberId,
    );

    if (pendingEntries.length === 0) throw new NoPendingCommissionsError();

    const entryIds = pendingEntries.map((e: any) => e.id);

    return this.commissionRepository.payEntries(
      entryIds,
      input.barbershopId,
      staffMemberId,
      input.note,
    );
  }
}
