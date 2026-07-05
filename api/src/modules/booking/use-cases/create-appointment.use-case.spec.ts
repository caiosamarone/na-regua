/// <reference types="jest" />

import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { CreateAppointmentUseCase } from "./create-appointment.use-case";

describe("CreateAppointmentUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: CreateAppointmentUseCase;

  const shopId = "shop-1";
  const customerId = "cust-1";
  const barberId = "barber-1";
  const serviceId = "svc-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new CreateAppointmentUseCase(repository);

    repository.barbershops.push({
      id: shopId,
      name: "Barbearia Teste",
      active: true,
      cancellationLeadTimeMinutes: 180,
    } as any);

    repository.services.push({
      id: serviceId,
      barbershopId: shopId,
      name: "Corte",
      durationMinutes: 30,
      price: 50 as any,
      isActive: true,
    } as any);

    repository.staffMembers.push({
      id: barberId,
      barbershopId: shopId,
      name: "Barbeiro Teste",
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should create an appointment successfully", async () => {
    const result = await useCase.execute({
      barbershopId: shopId,
      customerId,
      barberId,
      serviceId,
      startTime: "2026-07-06T14:00:00.000Z",
    });

    expect(result.id).toBeDefined();
    expect(result.status).toBe("BOOKED");
    expect(result.serviceName).toBe("Corte");
    expect(result.durationAtBooking).toBe(30);
  });

  it("should throw AppointmentConflictError when slot is already booked", async () => {
    const startTime = new Date("2026-07-06T14:00:00.000Z");
    const endTime = new Date("2026-07-06T14:30:00.000Z");

    repository.appointments.push({
      id: "apt-1",
      barbershopId: shopId,
      customerId: "other-cust",
      barberId,
      serviceId,
      serviceName: "Corte",
      priceAtBooking: 50 as any,
      durationAtBooking: 30,
      startTime,
      endTime,
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

    await expect(
      useCase.execute({
        barbershopId: shopId,
        customerId,
        barberId,
        serviceId,
        startTime: "2026-07-06T14:00:00.000Z",
      }),
    ).rejects.toThrow("Conflito de horário");
  });

  it("should throw when barbershop not found", async () => {
    await expect(
      useCase.execute({
        barbershopId: "non-existent",
        customerId,
        barberId,
        serviceId,
        startTime: "2026-07-06T14:00:00.000Z",
      }),
    ).rejects.toThrow("Barbearia não encontrada");
  });

  it("should throw when barbershop is not active", async () => {
    repository.barbershops[0].active = false;

    await expect(
      useCase.execute({
        barbershopId: shopId,
        customerId,
        barberId,
        serviceId,
        startTime: "2026-07-06T14:00:00.000Z",
      }),
    ).rejects.toThrow("Barbearia não está ativa");
  });

  it("should throw when service is inactive", async () => {
    repository.services[0].isActive = false;

    await expect(
      useCase.execute({
        barbershopId: shopId,
        customerId,
        barberId,
        serviceId,
        startTime: "2026-07-06T14:00:00.000Z",
      }),
    ).rejects.toThrow("Serviço não encontrado ou inativo");
  });

  it("should throw when barber not found in this barbershop", async () => {
    await expect(
      useCase.execute({
        barbershopId: shopId,
        customerId,
        barberId: "other-barber",
        serviceId,
        startTime: "2026-07-06T14:00:00.000Z",
      }),
    ).rejects.toThrow("Profissional não encontrado");
  });
});
