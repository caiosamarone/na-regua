import {
  StaffRepository,
  UpdateStaffInput,
} from "../gateways/staff.repository";
import { StaffIsNotActive, StaffNotFoundError } from "../errors/staff-errors";

export class UpdateStaffUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(id: string, data: UpdateStaffInput) {
    const staff = await this.staffRepository.findById(id);
    if (!staff) throw new StaffNotFoundError();
    if (data.isBookable && !staff.isActive) {
      throw new StaffIsNotActive();
    }
    if (data.isActive) data.isBookable = true;

    return this.staffRepository.update(id, data);
  }
}
