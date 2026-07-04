import { BarbershopRepository, UpdateBarbershopProfileInput } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";
import { geocodeAddress } from "../helpers/geocoding.helper";

export class UpdateBarbershopProfileUseCase {
  constructor(private barbershopRepository: BarbershopRepository) {}

  async execute(barbershopId: string, input: UpdateBarbershopProfileInput) {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    let data = { ...input };

    if ((input.address || input.neighborhood || input.city || input.state) && input.latitude == null && input.longitude == null) {
      const addressStr = [
        input.address || barbershop.address,
        input.neighborhood || barbershop.neighborhood,
        input.city || barbershop.city,
        input.state || barbershop.state,
      ].join(", ");
      const geo = await geocodeAddress(addressStr);
      if (geo) {
        data = { ...data, latitude: geo.lat, longitude: geo.lng };
      }
    }

    return this.barbershopRepository.updateProfile(barbershopId, data);
  }
}
