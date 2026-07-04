import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

export class UpdateBarbershopStatusUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(barbershopId: string, active: boolean) {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    return this.barbershopRepository.updateStatus(barbershopId, active);
  }
}
