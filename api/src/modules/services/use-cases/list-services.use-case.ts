import { ServiceRepository } from "../gateways/service.repository";

export class ListServicesUseCase {
  constructor(private serviceRepository: ServiceRepository) {}

  async execute(barbershopId: string, includeInactive = false) {
    return this.serviceRepository.findByBarbershopId(barbershopId, includeInactive);
  }
}
