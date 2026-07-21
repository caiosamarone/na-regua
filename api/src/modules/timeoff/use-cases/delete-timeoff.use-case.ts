import { TimeOffRepository } from "../gateways/timeoff.repository";
import { TimeOffNotFoundError, NotYourTimeOffError } from "../errors/timeoff-errors";

export class DeleteTimeOffUseCase {
  constructor(private timeOffRepository: TimeOffRepository) {}

  async execute(id: string, staffMemberId?: string) {
    const timeOff = await this.timeOffRepository.findById(id);
    if (!timeOff) throw new TimeOffNotFoundError();

    if (staffMemberId && timeOff.staffMemberId !== staffMemberId) {
      throw new NotYourTimeOffError();
    }

    await this.timeOffRepository.delete(id);
  }
}
