/// <reference types="jest" />

import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { StaffListAppointmentsUseCase } from "./staff-list-appointments.use-case";

describe("StaffListAppointmentsUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: StaffListAppointmentsUseCase;

  const shopId = "shop-1";
  const barberId = "barber-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new StaffListAppointmentsUseCase(repository);

    const base = {
      barbershopId: shopId,
      serviceId: "svc-1",
      serviceName: "Corte",
      priceAtBooking: 50 as any,
      durationAtBooking: 30,
      cancelledById: null,
      cancelledByRole: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: "cust-1", name: "Cliente", email: "cliente@test.com" },
      barber: { id: barberId, name: "Barbeiro" },
      service: { name: "Corte" },
    };

    repository.appointments.push(
      {
        ...base,
        id: "apt-1",
        customerId: "cust-1",
        barberId,
        startTime: new Date("2026-07-06T14:00:00Z"),
        endTime: new Date("2026-07-06T14:30:00Z"),
        status: "BOOKED",
      } as any,
      {
        ...base,
        id: "apt-2",
        customerId: "cust-2",
        barberId: "barber-2",
        startTime: new Date("2026-07-07T10:00:00Z"),
        endTime: new Date("2026-07-07T10:30:00Z"),
        status: "BOOKED",
      } as any,
      {
        ...base,
        id: "apt-3",
        customerId: "cust-1",
        barberId,
        startTime: new Date("2026-07-08T14:00:00Z"),
        endTime: new Date("2026-07-08T14:30:00Z"),
        status: "DONE",
      } as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return all appointments for admin", async () => {
    const result = await useCase.execute({
      barbershopId: shopId,
      page: 1,
      pageSize: 20,
      staffRole: "BARBERSHOP_ADMIN",
      staffId: "admin-1",
    });

    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it("should filter by barber for BARBER role", async () => {
    const result = await useCase.execute({
      barbershopId: shopId,
      page: 1,
      pageSize: 20,
      staffRole: "BARBER",
      staffId: barberId,
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should filter by status", async () => {
    const result = await useCase.execute({
      barbershopId: shopId,
      status: "DONE",
      page: 1,
      pageSize: 20,
      staffRole: "BARBERSHOP_ADMIN",
      staffId: "admin-1",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe("DONE");
  });

  it("should paginate results", async () => {
    const result = await useCase.execute({
      barbershopId: shopId,
      page: 1,
      pageSize: 2,
      staffRole: "BARBERSHOP_ADMIN",
      staffId: "admin-1",
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(3);
  });
});
