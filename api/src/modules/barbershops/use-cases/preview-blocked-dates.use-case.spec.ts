/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { PreviewBlockedDatesUseCase } from "./preview-blocked-dates.use-case";

describe("PreviewBlockedDatesUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: PreviewBlockedDatesUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new PreviewBlockedDatesUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return affected appointments in the date range", async () => {
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

    const result = await useCase.execute("shop-1", "2026-07-05", "2026-07-07");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "apt-1",
      customerName: "Maria",
      serviceName: "Corte",
    });
  });

  it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
    await expect(useCase.execute("non-existent", "2026-07-05", "2026-07-07")).rejects.toThrow("Barbearia não encontrada");
  });
});
