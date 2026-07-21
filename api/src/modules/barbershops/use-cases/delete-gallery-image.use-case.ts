import { BarbershopRepository } from "../gateways/barbershop.repository";
import { CloudinaryService } from "../../../shared/services/cloudinary.service";
import { GalleryImageNotFoundError } from "../errors/barbershop-errors";

export class DeleteGalleryImageUseCase {
  constructor(
    private barbershopRepository: BarbershopRepository,
    private cloudinaryService: CloudinaryService,
  ) {}

  async execute(id: string) {
    const image = await this.barbershopRepository.findGalleryImageById(id);
    if (!image) throw new GalleryImageNotFoundError();

    await this.cloudinaryService.deleteImage(image.imageUrl);
    await this.barbershopRepository.deleteGalleryImage(id);

    const remaining = await this.barbershopRepository.findGallery(image.barbershopId);
    const sortedIds = remaining.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.id);
    await this.barbershopRepository.reorderGallery(sortedIds);
  }
}
