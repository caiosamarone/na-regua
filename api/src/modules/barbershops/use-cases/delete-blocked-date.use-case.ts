import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

export class DeleteBlockedDateUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(blockedDateId: string) {
    await this.barbershopRepository.deleteBlockedDate(blockedDateId);
  }
}
