import { ServiceRepository, CreateServiceInput } from "../gateways/service.repository";

export class CreateServiceUseCase {
  constructor(private serviceRepository: ServiceRepository) {}

  async execute(barbershopId: string, data: CreateServiceInput) {
    return this.serviceRepository.create(barbershopId, data);
  }
}
