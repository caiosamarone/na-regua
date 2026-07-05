/// <reference types="jest" />

import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { GetSlotsUseCase } from "./get-slots.use-case";

describe("GetSlotsUseCase", () => {
  let repository: InMemoryAppointmentRepository;
  let useCase: GetSlotsUseCase;

  const shopId = "shop-1";
  const serviceId = "svc-1";
  const barberId = "barber-1";

  beforeEach(() => {
    repository = new InMemoryAppointmentRepository();
    useCase = new GetSlotsUseCase(repository);

    repository.barbershops.push({
      id: shopId,
      name: "Barbearia Teste",
      slug: "barbearia-teste",
      address: "Rua Teste",
      cep: "01001-000",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      latitude: null,
      longitude: null,
      timezone: "America/Sao_Paulo",
      phone: null,
      logoUrl: null,
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    repository.services.push({
      id: serviceId,
      barbershopId: shopId,
      name: "Corte",
      description: null,
      durationMinutes: 30,
      price: 50 as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return slots for a given date", async () => {
    repository.operatingHours.push({
      id: "oh-1",
      barbershopId: shopId,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "12:00",
    } as any);

    const result = await useCase.execute(shopId, serviceId, "2026-07-06", barberId);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("startTimeLocal");
    expect(result[0]).toHaveProperty("startTimeUtc");
    expect(result[0]).toHaveProperty("endTimeUtc");
  });

  it("should exclude booked slots", async () => {
    repository.operatingHours.push({
      id: "oh-1",
      barbershopId: shopId,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "12:00",
    } as any);

    const startTime = new Date("2026-07-06T12:00:00Z");
    const endTime = new Date("2026-07-06T12:30:00Z");

    repository.appointments.push({
      id: "apt-1",
      barbershopId: shopId,
      customerId: "cust-1",
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

    const result = await useCase.execute(shopId, serviceId, "2026-07-06", barberId);

    const conflicted = result.filter(
      (s) => s.startTimeUtc.getTime() === startTime.getTime(),
    );
    expect(conflicted).toHaveLength(0);
  });

  it("should return empty array when barbershop has blocked dates", async () => {
    repository.blockedDates.push({
      id: "bd-1",
      barbershopId: shopId,
      startDate: new Date("2026-07-06T00:00:00Z"),
      endDate: new Date("2026-07-06T23:59:59Z"),
      reason: "Feriado",
      createdAt: new Date(),
    } as any);

    const result = await useCase.execute(shopId, serviceId, "2026-07-06", barberId);

    expect(result).toHaveLength(0);
  });

  it("should return empty array when no operating hours", async () => {
    const result = await useCase.execute(shopId, serviceId, "2026-07-05", barberId);

    expect(result).toHaveLength(0);
  });

  it("should throw when barbershop not found", async () => {
    await expect(
      useCase.execute("non-existent", serviceId, "2026-07-06"),
    ).rejects.toThrow("Barbearia não encontrada");
  });

  it("should throw when barbershop is not active", async () => {
    repository.barbershops[0].active = false;

    await expect(
      useCase.execute(shopId, serviceId, "2026-07-06"),
    ).rejects.toThrow("Barbearia não está ativa");
  });

  it("should throw when service not found", async () => {
    await expect(
      useCase.execute(shopId, "non-existent", "2026-07-06"),
    ).rejects.toThrow("Serviço não encontrado ou inativo");
  });
});
