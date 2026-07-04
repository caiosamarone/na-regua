/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { SearchBarbershopsUseCase } from "./search-barbershops.use-case";

describe("SearchBarbershopsUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: SearchBarbershopsUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new SearchBarbershopsUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should find barbershops by name", async () => {
    repository.barbershops.push(
      {
        id: "shop-1",
        name: "Barbearia do Zé",
        slug: "barbearia-do-ze",
        address: "Rua A, 123",
        cep: "01001-000",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        latitude: -23.55,
        longitude: -46.63,
        timezone: "America/Sao_Paulo",
        phone: null,
        logoUrl: null,
        slotIntervalMinutes: 30,
        cancellationLeadTimeMinutes: 180,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "shop-2",
        name: "Outra Barbearia",
        slug: "outra-barbearia",
        address: "Rua B, 456",
        cep: "02001-000",
        neighborhood: "Vila",
        city: "São Paulo",
        state: "SP",
        latitude: -23.56,
        longitude: -46.64,
        timezone: "America/Sao_Paulo",
        phone: null,
        logoUrl: null,
        slotIntervalMinutes: 30,
        cancellationLeadTimeMinutes: 180,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const result = await useCase.execute("Zé");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("shop-1");
  });

  it("should find barbershops by city", async () => {
    repository.barbershops.push({
      id: "shop-3",
      name: "Corte Legal",
      slug: "corte-legal",
      address: "Rua C, 789",
      cep: "03001-000",
      neighborhood: "Centro",
      city: "Campinas",
      state: "SP",
      latitude: -22.9,
      longitude: -47.06,
      timezone: "America/Sao_Paulo",
      phone: null,
      logoUrl: null,
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute("Campinas");
    expect(result).toHaveLength(1);
  });

  it("should find barbershops by neighborhood", async () => {
    repository.barbershops.push({
      id: "shop-4",
      name: "Bigode Fino",
      slug: "bigode-fino",
      address: "Rua D, 101",
      cep: "04001-000",
      neighborhood: "Vila Madalena",
      city: "São Paulo",
      state: "SP",
      latitude: -23.55,
      longitude: -46.69,
      timezone: "America/Sao_Paulo",
      phone: null,
      logoUrl: null,
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute("Madalena");
    expect(result).toHaveLength(1);
  });

  it("should be case insensitive", async () => {
    repository.barbershops.push({
      id: "shop-5",
      name: "BARBEARIA TESTE",
      slug: "barbearia-teste",
      address: "Rua E, 202",
      cep: "05001-000",
      neighborhood: "Teste",
      city: "São Paulo",
      state: "SP",
      latitude: -23.55,
      longitude: -46.69,
      timezone: "America/Sao_Paulo",
      phone: null,
      logoUrl: null,
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute("barbearia");
    expect(result).toHaveLength(1);
  });

  it("should return empty array when nothing matches", async () => {
    const result = await useCase.execute("zzzzzz");
    expect(result).toHaveLength(0);
  });

  it("should filter by proximity when lat/lng/radiusKm provided", async () => {
    repository.barbershops.push(
      {
        id: "shop-1",
        name: "Barbearia do Zé",
        slug: "barbearia-do-ze",
        address: "Rua A, 123",
        cep: "01001-000",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        latitude: -23.55,
        longitude: -46.63,
        timezone: "America/Sao_Paulo",
        phone: null,
        logoUrl: null,
        slotIntervalMinutes: 30,
        cancellationLeadTimeMinutes: 180,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "shop-2",
        name: "Barbearia Longe",
        slug: "barbearia-longe",
        address: "Rua B, 456",
        cep: "02001-000",
        neighborhood: "Longe",
        city: "Campinas",
        state: "SP",
        latitude: -22.9,
        longitude: -47.06,
        timezone: "America/Sao_Paulo",
        phone: null,
        logoUrl: null,
        slotIntervalMinutes: 30,
        cancellationLeadTimeMinutes: 180,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const result = await useCase.execute("barbearia", -23.55, -46.63, 1);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("shop-1");
    expect(result[0].distanceKm).toBeLessThan(1);
  });

  it("should fallback to text-only search when coords not provided", async () => {
    repository.barbershops.push({
      id: "shop-3",
      name: "Corte Legal",
      slug: "corte-legal",
      address: "Rua C, 789",
      cep: "03001-000",
      neighborhood: "Centro",
      city: "Campinas",
      state: "SP",
      latitude: -22.9,
      longitude: -47.06,
      timezone: "America/Sao_Paulo",
      phone: null,
      logoUrl: null,
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute("Campinas");
    expect(result).toHaveLength(1);
    expect(result[0].distanceKm).toBeNull();
  });
});
