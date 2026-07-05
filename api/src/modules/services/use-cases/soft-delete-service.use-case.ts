import { ServiceRepository } from "../gateways/service.repository";
import { ServiceNotFoundError } from "../errors/service-errors";

export class SoftDeleteServiceUseCase {
  constructor(private serviceRepository: ServiceRepository) {}

  async execute(id: string) {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new ServiceNotFoundError();

    await this.serviceRepository.softDelete(id);
  }
}
