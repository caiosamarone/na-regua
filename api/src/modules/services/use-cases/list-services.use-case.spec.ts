/// <reference types="jest" />

import { InMemoryServiceRepository } from "../../../tests/helpers/in-memory-service.repository";
import { ListServicesUseCase } from "./list-services.use-case";

describe("ListServicesUseCase", () => {
  let repository: InMemoryServiceRepository;
  let useCase: ListServicesUseCase;

  const shopId = "shop-1";

  beforeEach(() => {
    repository = new InMemoryServiceRepository();
    useCase = new ListServicesUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return only active services by default", async () => {
    repository.services.push(
      { id: "svc-1", barbershopId: shopId, name: "Corte", description: null, durationMinutes: 30, price: 50 as any, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "svc-2", barbershopId: shopId, name: "Barba", description: null, durationMinutes: 20, price: 30 as any, isActive: false, createdAt: new Date(), updatedAt: new Date() },
    );

    const result = await useCase.execute(shopId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Corte");
  });

  it("should return all services when includeInactive is true", async () => {
    repository.services.push(
      { id: "svc-1", barbershopId: shopId, name: "Corte", description: null, durationMinutes: 30, price: 50 as any, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "svc-2", barbershopId: shopId, name: "Barba", description: null, durationMinutes: 20, price: 30 as any, isActive: false, createdAt: new Date(), updatedAt: new Date() },
    );

    const result = await useCase.execute(shopId, true);

    expect(result).toHaveLength(2);
  });

  it("should return empty array when barbershop has no services", async () => {
    const result = await useCase.execute(shopId);

    expect(result).toHaveLength(0);
  });
});
