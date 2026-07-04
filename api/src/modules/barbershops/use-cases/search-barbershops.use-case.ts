import { BarbershopRepository } from "../gateways/barbershop.repository";

export class SearchBarbershopsUseCase {
  constructor(
    private barbershopRepository: BarbershopRepository,
  ) {}

  async execute(query: string) {
    return this.barbershopRepository.search(query);
  }
}
