/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { ReplaceOperatingHoursUseCase } from "./replace-operating-hours.use-case";

describe("ReplaceOperatingHoursUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: ReplaceOperatingHoursUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new ReplaceOperatingHoursUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should replace operating hours successfully", async () => {
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

    const hours = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
      { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
    ];

    await useCase.execute("shop-1", hours);

    const saved = repository.operatingHours.filter((oh) => oh.barbershopId === "shop-1");
    expect(saved).toHaveLength(3);
  });

  it("should throw OperatingHoursOverlapError for overlapping intervals on the same day", async () => {
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

    const hours = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
      { dayOfWeek: 1, startTime: "11:00", endTime: "15:00" },
    ];

    await expect(useCase.execute("shop-1", hours)).rejects.toThrow("Horários operacionais não podem se sobrepor no mesmo dia");
  });

  it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
    await expect(useCase.execute("non-existent", [])).rejects.toThrow("Barbearia não encontrada");
  });
});
