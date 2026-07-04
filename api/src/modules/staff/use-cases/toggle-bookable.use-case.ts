import { StaffRepository } from "../gateways/staff.repository";
import { StaffNotFoundError } from "../errors/staff-errors";

export class ToggleBookableUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(id: string, isBookable: boolean) {
    const staff = await this.staffRepository.findById(id);
    if (!staff) throw new StaffNotFoundError();

    return this.staffRepository.toggleBookable(id, isBookable);
  }
}
