/// <reference types="jest" />

import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { GetCustomerAppointmentDetailUseCase } from "./get-customer-appointment-detail.use-case";

describe("GetCustomerAppointmentDetailUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: GetCustomerAppointmentDetailUseCase;

  const customerId = "cust-1";
  const shopId = "shop-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new GetCustomerAppointmentDetailUseCase(repository);

    repository.appointments.push({
      id: "apt-1",
      barbershopId: shopId,
      customerId,
      barberId: "barber-1",
      serviceId: "svc-1",
      serviceName: "Corte",
      priceAtBooking: 50 as any,
      durationAtBooking: 30,
      startTime: new Date("2026-07-06T14:00:00Z"),
      endTime: new Date("2026-07-06T14:30:00Z"),
      status: "BOOKED",
      cancelledById: null,
      cancelledByRole: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: customerId, name: "Cliente", email: "cliente@test.com" },
      barber: { id: "barber-1", name: "Barbeiro" },
      service: { name: "Corte" },
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return appointment detail for the customer", async () => {
    const result = await useCase.execute("apt-1", customerId);

    expect(result.id).toBe("apt-1");
    expect(result.customer?.id).toBe(customerId);
    expect(result.service?.name).toBe("Corte");
  });

  it("should throw AppointmentNotFoundError when appointment does not exist", async () => {
    await expect(
      useCase.execute("non-existent", customerId),
    ).rejects.toThrow("Agendamento não encontrado");
  });

  it("should throw AppointmentNotFoundError when appointment belongs to another customer", async () => {
    await expect(
      useCase.execute("apt-1", "other-cust"),
    ).rejects.toThrow("Agendamento não encontrado");
  });
});
