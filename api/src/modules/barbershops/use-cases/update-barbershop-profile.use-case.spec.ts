/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { UpdateBarbershopProfileUseCase } from "./update-barbershop-profile.use-case";

describe("UpdateBarbershopProfileUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: UpdateBarbershopProfileUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new UpdateBarbershopProfileUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should update barbershop profile fields", async () => {
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

    const result = await useCase.execute("shop-1", {
      name: "Barbearia Renovada",
      phone: "11988888888",
    });

    expect(result.name).toBe("Barbearia Renovada");
    expect(result.phone).toBe("11988888888");
    expect(repository.barbershops[0].name).toBe("Barbearia Renovada");
  });

  it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
    await expect(useCase.execute("non-existent", { name: "X" })).rejects.toThrow("Barbearia não encontrada");
  });
});
