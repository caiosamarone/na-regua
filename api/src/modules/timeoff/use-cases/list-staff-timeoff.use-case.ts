import { TimeOffRepository } from "../gateways/timeoff.repository";

export class ListStaffTimeOffUseCase {
  constructor(private timeOffRepository: TimeOffRepository) {}

  async execute(staffMemberId: string) {
    return this.timeOffRepository.findByStaffMember(staffMemberId);
  }
}
