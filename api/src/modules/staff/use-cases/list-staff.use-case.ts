import { StaffRepository } from "../gateways/staff.repository";

export class ListStaffUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(barbershopId: string, includeInactive = false) {
    return this.staffRepository.findByBarbershopId(barbershopId, includeInactive);
  }
}
