/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { UpdateBarbershopStatusUseCase } from "./update-barbershop-status.use-case";

describe("UpdateBarbershopStatusUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: UpdateBarbershopStatusUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new UpdateBarbershopStatusUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should update barbershop active field", async () => {
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
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute("shop-1", true);

    expect(result.active).toBe(true);
    expect(repository.barbershops[0].active).toBe(true);
  });

  it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
    await expect(useCase.execute("non-existent", true)).rejects.toThrow("Barbearia não encontrada");
  });
});
