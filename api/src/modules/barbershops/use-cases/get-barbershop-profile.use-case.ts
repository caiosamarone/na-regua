import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";

export class GetBarbershopProfileUseCase {
  constructor(
    private barbershopRepository: BarbershopRepository,
  ) {}

  async execute(slugOrId: string) {
    const barbershop =
      (await this.barbershopRepository.findBySlug(slugOrId)) ??
      (await this.barbershopRepository.findById(slugOrId));

    if (!barbershop) {
      throw new BarbershopNotFoundError();
    }

    const [operatingHours, services, staff, gallery] = await Promise.all([
      this.barbershopRepository.findOperatingHours(barbershop.id),
      this.barbershopRepository.findServices(barbershop.id),
      this.barbershopRepository.findBookableStaff(barbershop.id),
      this.barbershopRepository.findGallery(barbershop.id),
    ]);

    return {
      ...barbershop,
      operatingHours,
      services,
      staff,
      gallery,
    };
  }
}
