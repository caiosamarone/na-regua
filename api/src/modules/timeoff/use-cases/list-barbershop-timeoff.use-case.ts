import { TimeOffRepository } from "../gateways/timeoff.repository";

export class ListBarbershopTimeOffUseCase {
  constructor(private timeOffRepository: TimeOffRepository) {}

  async execute(barbershopId: string) {
    return this.timeOffRepository.findByBarbershop(barbershopId);
  }
}
