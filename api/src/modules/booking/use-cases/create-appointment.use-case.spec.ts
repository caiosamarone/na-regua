/// <reference types="jest" />

import { InMemoryAppointmentRepository } from "../../../tests/helpers/in-memory-appointment.repository";
import { CreateAppointmentUseCase } from "./create-appointment.use-case";
import type { NotificationJobScheduler } from "../../notifications/jobs/notification-job-scheduler";
import { addMinutes } from "date-fns";

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
      timezone: "America/Sao_Paulo",
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
    } as any);

    repository.operatingHours.push({
      id: "oh-1",
      barbershopId: shopId,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "18:00",
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

  it("should throw when date is blocked", async () => {
    repository.blockedDates.push({
      id: "bd-1",
      barbershopId: shopId,
      startDate: new Date("2026-07-06T00:00:00Z"),
      endDate: new Date("2026-07-06T23:59:59Z"),
      reason: "Feriado",
      createdAt: new Date(),
    } as any);

    await expect(
      useCase.execute({
        barbershopId: shopId,
        customerId,
        barberId,
        serviceId,
        startTime: "2026-07-06T14:00:00.000Z",
      }),
    ).rejects.toThrow("Data bloqueada");
  });

  it("should throw when barbershop is closed on that day", async () => {
    // 2026-07-05 is Sunday (dayOfWeek = 0), no operating hours for it
    await expect(
      useCase.execute({
        barbershopId: shopId,
        customerId,
        barberId,
        serviceId,
        startTime: "2026-07-05T14:00:00.000Z",
      }),
    ).rejects.toThrow("Barbearia fechada neste dia");
  });

  it("should throw when outside operating hours", async () => {
    // 14:00 UTC = 11:00 BRT on July 6 (Mon) — operating hours are 09:00-18:00, so this is fine
    // 23:00 UTC = 20:00 BRT — outside operating hours
    await expect(
      useCase.execute({
        barbershopId: shopId,
        customerId,
        barberId,
        serviceId,
        startTime: "2026-07-06T23:00:00.000Z",
      }),
    ).rejects.toThrow("Fora do horário de funcionamento");
  });

  it("should throw when slot does not align with interval", async () => {
    repository.barbershops[0].slotIntervalMinutes = 30;

    await expect(
      useCase.execute({
        barbershopId: shopId,
        customerId,
        barberId,
        serviceId,
        startTime: "2026-07-06T14:15:00.000Z",
      }),
    ).rejects.toThrow("Horário não respeita o intervalo de agendamento");
  });

  it("should schedule a push reminder when scheduler is provided", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-06T12:00:00.000Z"));

    const mockScheduler: jest.Mocked<NotificationJobScheduler> = {
      scheduleReminder: jest.fn(),
    };
    useCase = new CreateAppointmentUseCase(repository, mockScheduler);

    const result = await useCase.execute({
      barbershopId: shopId,
      customerId,
      barberId,
      serviceId,
      startTime: "2026-07-06T14:00:00.000Z",
    });

    expect(mockScheduler.scheduleReminder).toHaveBeenCalledTimes(1);
    expect(mockScheduler.scheduleReminder).toHaveBeenCalledWith(
      result.id,
      addMinutes(new Date("2026-07-06T12:00:00.000Z"), 1),
    );

    jest.useRealTimers();
  });
});
