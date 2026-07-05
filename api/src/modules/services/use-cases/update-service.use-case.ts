import { ServiceRepository, UpdateServiceInput } from "../gateways/service.repository";
import { ServiceNotFoundError } from "../errors/service-errors";

export class UpdateServiceUseCase {
  constructor(private serviceRepository: ServiceRepository) {}

  async execute(id: string, data: UpdateServiceInput) {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new ServiceNotFoundError();

    return this.serviceRepository.update(id, data);
  }
}
