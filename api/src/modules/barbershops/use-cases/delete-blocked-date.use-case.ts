import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BlockedDateNotFoundError } from "../errors/barbershop-errors";

export class DeleteBlockedDateUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(blockedDateId: string) {
    const blockedDate = await this.barbershopRepository.findBlockedDateById(blockedDateId);
    if (!blockedDate) throw new BlockedDateNotFoundError();

    await this.barbershopRepository.deleteBlockedDate(blockedDateId);
  }
}
