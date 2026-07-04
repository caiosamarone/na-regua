/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { GetBarbershopProfileUseCase } from "./get-barbershop-profile.use-case";


describe("GetBarbershopProfileUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: GetBarbershopProfileUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new GetBarbershopProfileUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return profile when found by slug", async () => {
    repository.barbershops.push({
      id: "shop-1",
      name: "Barbearia Teste",
      slug: "barbearia-teste",
      address: "Rua Teste, 123",
      cep: "01001-000",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      latitude: -23.55,
      longitude: -46.63,
      timezone: "America/Sao_Paulo",
      phone: "11999999999",
      logoUrl: null,
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.operatingHours.push(
      {
        id: "oh-1",
        barbershopId: "shop-1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "18:00",
      },
      {
        id: "oh-2",
        barbershopId: "shop-1",
        dayOfWeek: 2,
        startTime: "08:00",
        endTime: "18:00",
      },
    );

    repository.services.push({
      id: "svc-1",
      barbershopId: "shop-1",
      name: "Corte",
      description: "Corte simples",
      durationMinutes: 30,
      price: 50 as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute("barbearia-teste");

    expect(result.id).toBe("shop-1");
    expect(result.name).toBe("Barbearia Teste");
    expect(result.operatingHours).toHaveLength(2);
    expect(result.services).toHaveLength(1);
    expect(result.services[0].name).toBe("Corte");
  });

  it("should return profile when found by id", async () => {
    repository.barbershops.push({
      id: "shop-2",
      name: "Outra Barbearia",
      slug: "outra",
      address: "Rua X, 456",
      cep: "02001-000",
      neighborhood: "Vila",
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

    const result = await useCase.execute("shop-2");
    expect(result.id).toBe("shop-2");
  });

  it("should throw BarbershopNotFoundError when not found", async () => {
    await expect(useCase.execute("nao-existe")).rejects.toThrow("Barbearia não encontrada");
  });

  it("should include operating hours sorted by dayOfWeek", async () => {
    repository.barbershops.push({
      id: "shop-3",
      name: "Com Horários",
      slug: "com-horarios",
      address: "Rua Z, 789",
      cep: "03001-000",
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

    repository.operatingHours.push(
      { id: "oh-3", barbershopId: "shop-3", dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
      { id: "oh-1", barbershopId: "shop-3", dayOfWeek: 1, startTime: "08:00", endTime: "18:00" },
    );

    const result = await useCase.execute("com-horarios");
    expect(result.operatingHours[0].dayOfWeek).toBe(1);
    expect(result.operatingHours[1].dayOfWeek).toBe(3);
  });
});
