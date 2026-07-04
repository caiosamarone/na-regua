import { BarbershopRepository } from "../gateways/barbershop.repository";

export class GetNearbyBarbershopsUseCase {
  constructor(
    private barbershopRepository: BarbershopRepository,
  ) {}

  async execute(lat: number, lng: number, radiusKm: number) {
    return this.barbershopRepository.findNearby(lat, lng, radiusKm);
  }
}
