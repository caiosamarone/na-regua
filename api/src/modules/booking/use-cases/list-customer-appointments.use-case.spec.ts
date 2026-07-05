/// <reference types="jest" />

import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { ListCustomerAppointmentsUseCase } from "./list-customer-appointments.use-case";

describe("ListCustomerAppointmentsUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: ListCustomerAppointmentsUseCase;

  const customerId = "cust-1";
  const shopId = "shop-1";
  const barberId = "barber-1";
  const serviceId = "svc-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new ListCustomerAppointmentsUseCase(repository);

    const baseAppointment = {
      barbershopId: shopId,
      barberId,
      serviceId,
      serviceName: "Corte",
      priceAtBooking: 50 as any,
      durationAtBooking: 30,
      cancelledById: null,
      cancelledByRole: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: null,
      barber: { id: barberId, name: "Barbeiro" },
      service: { name: "Corte" },
    };

    repository.appointments.push(
      {
        ...baseAppointment,
        id: "apt-1",
        customerId,
        startTime: new Date("2026-07-06T14:00:00Z"),
        endTime: new Date("2026-07-06T14:30:00Z"),
        status: "BOOKED",
      } as any,
      {
        ...baseAppointment,
        id: "apt-2",
        customerId,
        startTime: new Date("2026-07-07T10:00:00Z"),
        endTime: new Date("2026-07-07T10:30:00Z"),
        status: "CANCELLED",
      } as any,
      {
        ...baseAppointment,
        id: "apt-3",
        customerId: "other-cust",
        startTime: new Date("2026-07-08T14:00:00Z"),
        endTime: new Date("2026-07-08T14:30:00Z"),
        status: "BOOKED",
      } as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return all appointments for the customer", async () => {
    const result = await useCase.execute({
      customerId,
      page: 1,
      pageSize: 20,
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should filter by status", async () => {
    const result = await useCase.execute({
      customerId,
      status: "BOOKED",
      page: 1,
      pageSize: 20,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe("BOOKED");
  });

  it("should paginate results", async () => {
    const result = await useCase.execute({
      customerId,
      page: 1,
      pageSize: 1,
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(2);
  });
});
