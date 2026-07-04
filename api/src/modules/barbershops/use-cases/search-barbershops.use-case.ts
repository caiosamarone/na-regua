import { BarbershopRepository } from "../gateways/barbershop.repository";

export class SearchBarbershopsUseCase {
  constructor(
    private barbershopRepository: BarbershopRepository,
  ) {}

  async execute(query: string | undefined, lat?: number, lng?: number, radiusKm?: number) {
    return this.barbershopRepository.search(query, lat, lng, radiusKm);
  }
}
