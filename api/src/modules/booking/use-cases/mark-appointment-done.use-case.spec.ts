import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { MarkAppointmentDoneUseCase } from "./mark-appointment-done.use-case";

describe("MarkAppointmentDoneUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: MarkAppointmentDoneUseCase;

  const shopId = "shop-1";
  const barberId = "barber-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new MarkAppointmentDoneUseCase(repository);

    repository.appointments.push({
      id: "apt-1",
      barbershopId: shopId,
      customerId: "cust-1",
      barberId,
      serviceId: "svc-1",
      serviceName: "Corte",
      priceAtBooking: 50 as any,
      durationAtBooking: 30,
      startTime: new Date(Date.now() - 60 * 60 * 1000),
      endTime: new Date(Date.now() - 30 * 60 * 1000),
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

  it("should allow admin to mark appointment as DONE", async () => {
    const result = await useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId);

    expect(result.status).toBe("DONE");
  });

  it("should allow barber to mark own appointment as DONE", async () => {
    const result = await useCase.execute("apt-1", barberId, "BARBER", shopId);

    expect(result.status).toBe("DONE");
  });

  it("should throw AppointmentNotFoundError for barber marking another's appointment", async () => {
    await expect(
      useCase.execute("apt-1", "other-barber", "BARBER", shopId),
    ).rejects.toThrow("Agendamento não encontrado");
  });

  it("should throw AppointmentNotYetStartedError when startTime has not passed", async () => {
    repository.appointments[0].startTime = new Date(Date.now() + 60 * 60 * 1000);
    repository.appointments[0].endTime = new Date(Date.now() + 90 * 60 * 1000);

    await expect(
      useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId),
    ).rejects.toThrow("Agendamento ainda não iniciado");
  });

  it("should throw AppointmentNotActionableError when status is CANCELLED", async () => {
    repository.appointments[0].status = "CANCELLED";

    await expect(
      useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId),
    ).rejects.toThrow("Agendamento não pode ser alterado");
  });

  it("should throw AppointmentNotActionableError when status is DONE", async () => {
    repository.appointments[0].status = "DONE";

    await expect(
      useCase.execute("apt-1", "admin-1", "BARBERSHOP_ADMIN", shopId),
    ).rejects.toThrow("Agendamento não pode ser alterado");
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
