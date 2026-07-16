import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { StaffCancelAppointmentUseCase } from "./staff-cancel-appointment.use-case";

describe("StaffCancelAppointmentUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: StaffCancelAppointmentUseCase;

  const shopId = "shop-1";
  const barberId = "barber-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new StaffCancelAppointmentUseCase(repository);

    repository.appointments.push({
      id: "apt-1",
      barbershopId: shopId,
      customerId: "cust-1",
      barberId,
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
      customer: null,
      barber: null,
      service: null,
    } as any);
  });

  afterEach(() => {
    repository.reset();
  });

  it("should allow admin to cancel any appointment", async () => {
    const result = await useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId);

    expect(result.status).toBe("CANCELLED");
    expect(result.cancelledByRole).toBe("BARBERSHOP_ADMIN");
  });

  it("should allow barber to cancel own appointment", async () => {
    const result = await useCase.execute("apt-1", barberId, "BARBER", shopId);

    expect(result.status).toBe("CANCELLED");
    expect(result.cancelledByRole).toBe("BARBER");
  });

  it("should throw AppointmentNotFoundError for barber cancelling another's appointment", async () => {
    await expect(
      useCase.execute("apt-1", "other-barber", "BARBER", shopId),
    ).rejects.toThrow("Agendamento não encontrado");
  });

  it("should throw AppointmentNotActionableError when status is DONE", async () => {
    repository.appointments[0].status = "DONE";

    await expect(
      useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId),
    ).rejects.toThrow("Agendamento não pode ser alterado");
  });

  it("should throw AppointmentNotActionableError when status is CANCELLED", async () => {
    repository.appointments[0].status = "CANCELLED";

    await expect(
      useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId),
    ).rejects.toThrow("Agendamento não pode ser alterado");
  });

  it("should accept optional reason", async () => {
    const result = await useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId, "Cliente não compareceu");

    expect(result.cancellationReason).toBe("Cliente não compareceu");
  });

  it("should throw AppointmentNotFoundError when appointment does not exist", async () => {
    await expect(
      useCase.execute("non-existent", "admin-1", "BARBERSHOP_ADMIN", shopId),
    ).rejects.toThrow("Agendamento não encontrado");
  });

  it("should throw AppointmentNotFoundError when appointment is from another barbershop", async () => {
    await expect(
      useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", "other-shop"),
    ).rejects.toThrow("Agendamento não encontrado");
  });
});
