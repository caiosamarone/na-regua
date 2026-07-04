/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { GetBookableStaffUseCase } from "./get-bookable-staff.use-case";

describe("GetBookableStaffUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: GetBookableStaffUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new GetBookableStaffUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return only staff with isBookable=true, isActive=true, role BARBER or BARBERSHOP_ADMIN", async () => {
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

    repository.staffMembers.push(
      { id: "stf-1", barbershopId: "shop-1", name: "João", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null },
      { id: "stf-2", barbershopId: "shop-1", name: "Admin", role: "BARBERSHOP_ADMIN", isBookable: true, isActive: true, avatarUrl: null },
      { id: "stf-3", barbershopId: "shop-1", name: "Não Bookable", role: "BARBER", isBookable: false, isActive: true, avatarUrl: null },
      { id: "stf-4", barbershopId: "shop-1", name: "Inativo", role: "BARBER", isBookable: true, isActive: false, avatarUrl: null },
      { id: "stf-5", barbershopId: "shop-1", name: "Admin Inativo", role: "BARBERSHOP_ADMIN", isBookable: true, isActive: false, avatarUrl: null },
    );

    const result = await useCase.execute("shop-1");

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(["stf-1", "stf-2"]);
  });

  it("should throw BarbershopNotFoundError when barbershop does not exist", async () => {
    await expect(useCase.execute("non-existent")).rejects.toThrow("Barbearia não encontrada");
  });
});
