import { AppointmentRepository } from "../gateways/appointment.repository";

export interface ListCustomerAppointmentsInput {
  customerId: string;
  status?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export class ListCustomerAppointmentsUseCase {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute(input: ListCustomerAppointmentsInput) {
    return this.appointmentRepository.findByCustomerId(input.customerId, {
      status: input.status,
      from: input.from,
      to: input.to,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
