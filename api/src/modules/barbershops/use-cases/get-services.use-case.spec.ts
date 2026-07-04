/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { GetServicesUseCase } from "./get-services.use-case";

describe("GetServicesUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: GetServicesUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new GetServicesUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return only active services by default", async () => {
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

    repository.services.push(
      { id: "svc-1", barbershopId: "shop-1", name: "Corte", description: null, durationMinutes: 30, price: 50 as any, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "svc-2", barbershopId: "shop-1", name: "Barba", description: null, durationMinutes: 20, price: 30 as any, isActive: false, createdAt: new Date(), updatedAt: new Date() },
      { id: "svc-3", barbershopId: "shop-1", name: "Hidratação", description: null, durationMinutes: 40, price: 80 as any, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    );

    const result = await useCase.execute("shop-1");

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.name)).toEqual(["Corte", "Hidratação"]);
  });

  it("should return all services when includeInactive is true", async () => {
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

    repository.services.push(
      { id: "svc-1", barbershopId: "shop-1", name: "Corte", description: null, durationMinutes: 30, price: 50 as any, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "svc-2", barbershopId: "shop-1", name: "Barba", description: null, durationMinutes: 20, price: 30 as any, isActive: false, createdAt: new Date(), updatedAt: new Date() },
    );

    const result = await useCase.execute("shop-1", true);

    expect(result).toHaveLength(2);
  });

  it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
    await expect(useCase.execute("non-existent")).rejects.toThrow("Barbearia não encontrada");
  });
});
