/// <reference types="jest" />

import { InMemoryServiceRepository } from "../../../tests/helpers/in-memory-service.repository";
import { UpdateServiceUseCase } from "./update-service.use-case";
describe("UpdateServiceUseCase", () => {
  let repository: InMemoryServiceRepository;
  let useCase: UpdateServiceUseCase;

  const shopId = "shop-1";

  beforeEach(() => {
    repository = new InMemoryServiceRepository();
    useCase = new UpdateServiceUseCase(repository);

    repository.services.push({
      id: "svc-1",
      barbershopId: shopId,
      name: "Corte",
      description: "Corte tradicional",
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

  it("should update service name and price", async () => {
    const result = await useCase.execute("svc-1", {
      name: "Corte Premium",
      price: 70,
    });

    expect(result.name).toBe("Corte Premium");
    expect(result.price).toBe(70);
    expect(result.durationMinutes).toBe(30);
  });

  it("should update duration minutes", async () => {
    const result = await useCase.execute("svc-1", {
      durationMinutes: 45,
    });

    expect(result.durationMinutes).toBe(45);
  });

  it("should throw ServiceNotFoundError when service does not exist", async () => {
    await expect(
      useCase.execute("non-existent", { name: "Novo" }),
    ).rejects.toThrow("Serviço não encontrado");
  });
});
