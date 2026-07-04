/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { GetNearbyBarbershopsUseCase } from "./get-nearby-barbershops.use-case";

describe("GetNearbyBarbershopsUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: GetNearbyBarbershopsUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new GetNearbyBarbershopsUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return barbershops within radius ordered by distance", async () => {
    repository.barbershops.push(
      {
        id: "shop-1",
        name: "Barbearia Centro",
        slug: "barbearia-centro",
        address: "Rua Centro, 123",
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
      },
      {
        id: "shop-2",
        name: "Barbearia Longe",
        slug: "barbearia-longe",
        address: "Rua Longe, 456",
        cep: "02001-000",
        neighborhood: "Zona Norte",
        city: "São Paulo",
        state: "SP",
        latitude: -23.4,
        longitude: -46.5,
        timezone: "America/Sao_Paulo",
        phone: "11988888888",
        logoUrl: null,
        slotIntervalMinutes: 30,
        cancellationLeadTimeMinutes: 180,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const result = await useCase.execute(-23.55, -46.63, 10);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("shop-1");
    expect(result[0].distanceKm).toBeLessThan(1);
  });

  it("should exclude inactive barbershops", async () => {
    repository.barbershops.push({
      id: "shop-3",
      name: "Fechada",
      slug: "fechada",
      address: "Rua X",
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
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute(-23.55, -46.63, 10);
    expect(result).toHaveLength(0);
  });

  it("should exclude barbershops without coordinates", async () => {
    repository.barbershops.push({
      id: "shop-4",
      name: "Sem Coord",
      slug: "sem-coord",
      address: "Rua Y",
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

    const result = await useCase.execute(-23.55, -46.63, 10);
    expect(result).toHaveLength(0);
  });
});
