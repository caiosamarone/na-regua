import { BarbershopRepository } from "../gateways/barbershop.repository";

export class GetGalleryUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(barbershopId: string) {
    return this.barbershopRepository.findGallery(barbershopId);
  }
}
