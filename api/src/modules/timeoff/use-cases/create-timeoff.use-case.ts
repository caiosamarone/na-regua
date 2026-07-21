import { fromZonedTime } from "date-fns-tz";
import { BarbershopRepository } from "../../barbershops/gateways/barbershop.repository";
import { TimeOffRepository, AffectedAppointment } from "../gateways/timeoff.repository";
import { EmailService } from "../../../shared/services/email.service";
import { validateStartDateNotInPast } from "../../barbershops/helpers/blocked-dates.helper";

export type TimeOffPreviewResult = AffectedAppointment[];

export type TimeOffConfirmResult = {
  timeOff: {
    id: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
  };
  cancelledCount: number;
};

export class CreateTimeOffUseCase {
  constructor(
    private barbershopRepository: BarbershopRepository,
    private timeOffRepository: TimeOffRepository,
    private emailService: EmailService,
  ) {}

  async execute(
    barbershopId: string,
    staffMemberId: string,
    startDate: string,
    endDate: string,
  ): Promise<TimeOffPreviewResult>;

  async execute(
    barbershopId: string,
    staffMemberId: string,
    startDate: string,
    endDate: string,
    startTime: string | null,
    endTime: string | null,
    cancelledById: string,
    cancelledByRole: string,
  ): Promise<TimeOffConfirmResult>;

  async execute(
    barbershopId: string,
    staffMemberId: string,
    startDate: string,
    endDate: string,
    startTime?: string | null,
    endTime?: string | null,
    cancelledById?: string,
    cancelledByRole?: string,
  ): Promise<TimeOffPreviewResult | TimeOffConfirmResult> {
    const barbershop = await this.barbershopRepository.findById(barbershopId);
    if (!barbershop) throw new Error("Barbearia não encontrada");

    validateStartDateNotInPast(startDate, barbershop.timezone);

    const start = fromZonedTime(`${startDate}T00:00:00`, barbershop.timezone);
    const endOfLastDay = new Date(endDate);
    endOfLastDay.setDate(endOfLastDay.getDate() + 1);
    const endDateStr = endOfLastDay.toISOString().split("T")[0];
    const end = fromZonedTime(`${endDateStr}T00:00:00`, barbershop.timezone);

    const affected = await this.timeOffRepository.findAppointmentsInRange(staffMemberId, start, end);

    if (cancelledById) {
      const timeOff = await this.timeOffRepository.create({
        barbershopId,
        staffMemberId,
        startDate: start,
        endDate: end,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
      });

      const cancelledCount = await this.timeOffRepository.cancelAppointmentsInRange(
        staffMemberId, start, end, cancelledById, cancelledByRole!, null,
      );

      for (const apt of affected) {
        if (apt.customerEmail) {
          await this.emailService.sendCancellation(apt.customerEmail, apt.id).catch(() => {});
        }
      }

      return {
        timeOff: {
          id: timeOff.id,
          startDate: timeOff.startDate.toISOString(),
          endDate: timeOff.endDate.toISOString(),
          startTime: timeOff.startTime,
          endTime: timeOff.endTime,
        },
        cancelledCount,
      };
    }

    return affected;
  }
}
