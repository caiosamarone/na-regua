import { StaffRepository } from "../gateways/staff.repository";
import { StaffNotFoundError, StaffHasFutureBookingsError } from "../errors/staff-errors";

export class SoftDeleteStaffUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(id: string) {
    const staff = await this.staffRepository.findById(id);
    if (!staff) throw new StaffNotFoundError();

    const futureBookings = await this.staffRepository.findFutureBookings(id);
    if (futureBookings.length > 0) {
      throw new StaffHasFutureBookingsError(
        futureBookings.map((b) => ({
          id: b.id,
          startTime: b.startTime.toISOString(),
          customerId: b.customerId,
        })),
      );
    }

    await this.staffRepository.softDelete(id);
  }
}
