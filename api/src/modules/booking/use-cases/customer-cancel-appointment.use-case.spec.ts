/// <reference types="jest" />

import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { CustomerCancelAppointmentUseCase } from "./customer-cancel-appointment.use-case";

describe("CustomerCancelAppointmentUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: CustomerCancelAppointmentUseCase;

  const customerId = "cust-1";
  const shopId = "shop-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new CustomerCancelAppointmentUseCase(repository);

    repository.barbershops.push({
      id: shopId,
      cancellationLeadTimeMinutes: 180,
    } as any);

    repository.appointments.push({
      id: "apt-1",
      barbershopId: shopId,
      customerId,
      barberId: "barber-1",
      serviceId: "svc-1",
      serviceName: "Corte",
      priceAtBooking: 50 as any,
      durationAtBooking: 30,
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: "BOOKED",
      cancelledById: null,
      cancelledByRole: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: null,
      barber: null,
      service: null,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should cancel a BOOKED appointment", async () => {
    const result = await useCase.execute("apt-1", customerId);

    expect(result.appointment.status).toBe("CANCELLED");
    expect(result.appointment.cancelledByRole).toBe("CUSTOMER");
    expect(result.warning).toBeUndefined();
  });

  it("should include warning when cancellation is within lead time", async () => {
    repository.appointments[0].startTime = new Date(Date.now() + 30 * 60 * 1000);

    const result = await useCase.execute("apt-1", customerId);

    expect(result.warning).toBeDefined();
    expect(result.warning).toContain("50%");
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

  it("should throw AppointmentNotActionableError when status is DONE", async () => {
    repository.appointments[0].status = "DONE";

    await expect(
      useCase.execute("apt-1", customerId),
    ).rejects.toThrow("Agendamento não pode ser alterado");
  });
});
