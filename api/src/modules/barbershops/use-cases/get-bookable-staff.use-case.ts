import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

export class GetBookableStaffUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(barbershopId: string) {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    return this.barbershopRepository.findBookableStaff(barbershopId);
  }
}
