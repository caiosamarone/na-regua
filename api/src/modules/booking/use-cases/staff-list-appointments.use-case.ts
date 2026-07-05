import { AppointmentRepository } from "../gateways/appointment.repository";

export interface StaffListAppointmentsInput {
  barbershopId: string;
  barberId?: string;
  status?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
  staffRole: string;
  staffId: string;
}

export class StaffListAppointmentsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(input: StaffListAppointmentsInput) {
    const barberId =
      input.staffRole === "BARBER" ? input.staffId : input.barberId;

    return this.appointmentRepository.findByBarbershopId(input.barbershopId, {
      status: input.status,
      from: input.from,
      to: input.to,
      barberId,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
