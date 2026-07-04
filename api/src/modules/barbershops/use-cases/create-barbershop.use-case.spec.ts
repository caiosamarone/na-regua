/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { CreateBarbershopUseCase } from "./create-barbershop.use-case";

class MockEmailService {
  sendInvite = jest.fn().mockResolvedValue(undefined);
}

describe("CreateBarbershopUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: CreateBarbershopUseCase;
  let emailService: MockEmailService;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    emailService = new MockEmailService();
    useCase = new CreateBarbershopUseCase(repository, emailService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should create barbershop and invitation token", async () => {
    const input = {
      name: "Barbearia Teste",
      slug: "barbearia-teste",
      address: "Rua Teste, 123",
      cep: "01001-000",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      timezone: "America/Sao_Paulo",
      latitude: -23.55,
      longitude: -46.63,
      adminEmail: "admin@test.com",
    };

    const result = await useCase.execute(input);

    expect(result.name).toBe("Barbearia Teste");
    expect(result.slug).toBe("barbearia-teste");
    expect(repository.barbershops).toHaveLength(1);
    expect(repository.invitationTokens).toHaveLength(1);
    expect(repository.invitationTokens[0].email).toBe("admin@test.com");
    expect(repository.invitationTokens[0].role).toBe("BARBERSHOP_ADMIN");
    expect(emailService.sendInvite).toHaveBeenCalledTimes(1);
    expect(emailService.sendInvite).toHaveBeenCalledWith(
      "admin@test.com",
      expect.stringContaining("/accept-invite?token="),
    );
  });

  it("should throw SlugAlreadyExistsError when slug already exists", async () => {
    repository.barbershops.push({
      id: "shop-1",
      name: "Existente",
      slug: "slug-existente",
      address: "Rua X, 456",
      cep: "02001-000",
      neighborhood: "Vila",
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

    const input = {
      name: "Nova",
      slug: "slug-existente",
      address: "Rua Y, 789",
      cep: "03001-000",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      timezone: "America/Sao_Paulo",
      latitude: -23.55,
      longitude: -46.63,
      adminEmail: "admin@test.com",
    };

    await expect(useCase.execute(input)).rejects.toThrow("Slug já está em uso");
  });
});
