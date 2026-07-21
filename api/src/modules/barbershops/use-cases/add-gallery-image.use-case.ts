import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

export class AddGalleryImageUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(barbershopId: string, imageUrl: string, caption: string | null) {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    const gallery = await this.barbershopRepository.findGallery(barbershopId);
    const maxSortOrder = gallery.reduce((max, img) => Math.max(max, img.sortOrder), -1);
    const sortOrder = maxSortOrder + 1;

    return this.barbershopRepository.addGalleryImage(barbershopId, imageUrl, caption, sortOrder);
  }
}
