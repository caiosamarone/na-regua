/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { ConfirmBlockedDatesUseCase } from "./confirm-blocked-dates.use-case";

class MockEmailService {
  sendInvite = jest.fn().mockResolvedValue(undefined);
  sendCancellation = jest.fn().mockResolvedValue(undefined);
}

describe("ConfirmBlockedDatesUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: ConfirmBlockedDatesUseCase;
  let emailService: MockEmailService;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    emailService = new MockEmailService();
    useCase = new ConfirmBlockedDatesUseCase(repository, emailService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should create blocked date and cancel overlapping appointments", async () => {
    repository.barbershops.push({
      id: "shop-1",
      name: "Barbearia Teste",
      slug: "barbearia-teste",
      address: "Rua Teste, 123",
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
    });

    repository.appointments.push(
      {
        id: "apt-1",
        barbershopId: "shop-1",
        customerId: "cust-1",
        barberId: "stf-1",
        serviceId: "svc-1",
        startTime: new Date("2026-07-05T10:00:00Z"),
        endTime: new Date("2026-07-05T10:30:00Z"),
        status: "BOOKED",
        cancelledById: null,
        cancelledByRole: null,
        cancellationReason: null,
        cancelledAt: null,
        customer: { id: "cust-1", name: "Maria", email: "maria@test.com" },
        service: { name: "Corte" },
      },
      {
        id: "apt-2",
        barbershopId: "shop-1",
        customerId: "cust-2",
        barberId: "stf-1",
        serviceId: "svc-2",
        startTime: new Date("2026-07-06T14:00:00Z"),
        endTime: new Date("2026-07-06T14:30:00Z"),
        status: "BOOKED",
        cancelledById: null,
        cancelledByRole: null,
        cancellationReason: null,
        cancelledAt: null,
        customer: { id: "cust-2", name: "João", email: "joao@test.com" },
        service: { name: "Barba" },
      },
    );

    const result = await useCase.execute(
      "shop-1",
      "2026-07-05",
      "2026-07-07",
      "Feriado",
      "admin-id",
      "BARBERSHOP_ADMIN",
    );

    expect(result.blockedDate.reason).toBe("Feriado");
    expect(result.cancelledCount).toBe(2);
    expect(repository.blockedDates).toHaveLength(1);
    expect(repository.appointments[0].status).toBe("CANCELLED");
    expect(repository.appointments[1].status).toBe("CANCELLED");
    expect(emailService.sendCancellation).toHaveBeenCalledTimes(2);
  });

  it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
    await expect(
      useCase.execute("non-existent", "2026-07-05", "2026-07-07", null, "admin-id", "BARBERSHOP_ADMIN"),
    ).rejects.toThrow("Barbearia não encontrada");
  });
});
