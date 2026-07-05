/// <reference types="jest" />

import { InMemoryServiceRepository } from "../../../tests/helpers/in-memory-service.repository";
import { CreateServiceUseCase } from "./create-service.use-case";

describe("CreateServiceUseCase", () => {
  let repository: InMemoryServiceRepository;
  let useCase: CreateServiceUseCase;

  const shopId = "shop-1";

  beforeEach(() => {
    repository = new InMemoryServiceRepository();
    useCase = new CreateServiceUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should create a service successfully", async () => {
    const result = await useCase.execute(shopId, {
      name: "Corte Degradê",
      description: "Corte com máquina e tesoura",
      durationMinutes: 45,
      price: 60,
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Corte Degradê");
    expect(result.durationMinutes).toBe(45);
    expect(result.price).toBe(60);
    expect(result.isActive).toBe(true);
    expect(result.barbershopId).toBe(shopId);
  });

  it("should create a service without optional description", async () => {
    const result = await useCase.execute(shopId, {
      name: "Corte Simples",
      durationMinutes: 30,
      price: 40,
    });

    expect(result.description).toBeNull();
  });
});
