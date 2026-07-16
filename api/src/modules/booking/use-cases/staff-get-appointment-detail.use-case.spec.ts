import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { StaffGetAppointmentDetailUseCase } from "./staff-get-appointment-detail.use-case";

describe("StaffGetAppointmentDetailUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: StaffGetAppointmentDetailUseCase;

  const shopId = "shop-1";
  const barberId = "barber-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new StaffGetAppointmentDetailUseCase(repository);

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
      customer: { id: "cust-1", name: "Cliente", email: "cliente@test.com" },
      barber: { id: barberId, name: "Barbeiro" },
      service: { name: "Corte" },
    } as any);
  });

  afterEach(() => {
    repository.reset();
  });

  it("should return appointment detail for admin", async () => {
    const result = await useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId);

    expect(result.id).toBe("apt-1");
    expect(result.customer?.name).toBe("Cliente");
  });

  it("should return appointment detail for the barber who owns it", async () => {
    const result = await useCase.execute("apt-1", barberId, "BARBER", shopId);

    expect(result.id).toBe("apt-1");
    expect(result.barber?.name).toBe("Barbeiro");
  });

  it("should throw AppointmentNotFoundError for barber trying to view another's appointment", async () => {
    await expect(
      useCase.execute("apt-1", "other-barber", "BARBER", shopId),
    ).rejects.toThrow("Agendamento não encontrado");
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
