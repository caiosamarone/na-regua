import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

export class ReorderGalleryUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(barbershopId: string, imageIds: string[]) {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    await this.barbershopRepository.reorderGallery(imageIds);
  }
}
