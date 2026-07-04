import { fromZonedTime } from "date-fns-tz";
import { BarbershopRepository } from "../gateways/barbershop.repository";
import { BarbershopNotFoundError } from "../errors/barbershop-errors";
import { EmailService } from "../../../shared/services/email.service";

export class ConfirmBlockedDatesUseCase {
  constructor(
    private barbershopRepository: BarbershopRepository,
    private emailService: EmailService,
  ) {}

  async execute(
    barbershopId: string,
    startDate: string,
    endDate: string,
    reason: string | null,
    cancelledById: string,
    cancelledByRole: string,
  ) {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new BarbershopNotFoundError();

    const start = fromZonedTime(`${startDate}T00:00:00`, barbershop.timezone);
    const endOfLastDay = new Date(endDate);
    endOfLastDay.setDate(endOfLastDay.getDate() + 1);
    const endDateStr = endOfLastDay.toISOString().split("T")[0];
    const end = fromZonedTime(`${endDateStr}T00:00:00`, barbershop.timezone);

    const affected = await this.barbershopRepository.findAppointmentsInRange(barbershopId, start, end);

    const blockedDate = await this.barbershopRepository.createBlockedDate(barbershopId, start, end, reason);

    const cancelledCount = await this.barbershopRepository.cancelAppointmentsInRange(
      barbershopId, start, end, cancelledById, cancelledByRole, reason,
    );

    for (const apt of affected) {
      if (apt.customer?.email) {
        await this.emailService.sendCancellation(apt.customer.email, apt.id).catch(() => {});
      }
    }

    return {
      blockedDate: {
        id: blockedDate.id,
        startDate: blockedDate.startDate.toISOString(),
        endDate: blockedDate.endDate.toISOString(),
        reason: blockedDate.reason,
      },
      cancelledCount,
    };
  }
}
