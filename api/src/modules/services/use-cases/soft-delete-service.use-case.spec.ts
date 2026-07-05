/// <reference types="jest" />

import { InMemoryServiceRepository } from "../../../tests/helpers/in-memory-service.repository";
import { SoftDeleteServiceUseCase } from "./soft-delete-service.use-case";
describe("SoftDeleteServiceUseCase", () => {
  let repository: InMemoryServiceRepository;
  let useCase: SoftDeleteServiceUseCase;

  const shopId = "shop-1";

  beforeEach(() => {
    repository = new InMemoryServiceRepository();
    useCase = new SoftDeleteServiceUseCase(repository);

    repository.services.push({
      id: "svc-1",
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

  it("should soft-delete a service", async () => {
    await useCase.execute("svc-1");

    const service = await repository.findById("svc-1");
    expect(service).not.toBeNull();
    expect(service!.isActive).toBe(false);
  });

  it("should throw ServiceNotFoundError when service does not exist", async () => {
    await expect(useCase.execute("non-existent")).rejects.toThrow(
      "Serviço não encontrado",
    );
  });
});
