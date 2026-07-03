/// <reference types="jest" />

import { hashToken } from "../../../shared/helpers/token.helper";
import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { AcceptInviteUseCase } from "./accept-invite.use-case";

jest.mock("../../../shared/helpers/password.helper", () => ({
  hashPassword: jest.fn().mockResolvedValue("$2a$10$mocked-hash"),
}));

const RAW_TOKEN = "invite-token-123";
const TOKEN_HASH = hashToken(RAW_TOKEN);

describe("AcceptInviteUseCase", () => {
  let repository: InMemoryAuthRepository;
  let useCase: AcceptInviteUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    useCase = new AcceptInviteUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should create staff from valid invitation", async () => {
    await repository.createInvitationToken(
      "invited@test.com",
      "barbershop-1",
      "BARBER" as any,
      TOKEN_HASH,
      new Date(Date.now() + 100_000),
    );

    await useCase.execute(RAW_TOKEN, "John Barber", "Str0ng!Pass");

    expect(repository.staff).toHaveLength(1);
    const created = repository.staff[0] as any;
    expect(created.email).toBe("invited@test.com");
    expect(created.name).toBe("John Barber");
    expect(created.passwordHash).toBe("$2a$10$mocked-hash");
    expect(created.barbershopId).toBe("barbershop-1");
    expect(created.role).toBe("BARBER");
  });

  it("should throw when invitation token is invalid", async () => {
    await expect(
      useCase.execute("invalid-token", "John", "Str0ng!Pass"),
    ).rejects.toThrow("Convite inválido ou expirado");
  });

  it("should throw when invitation token is already consumed", async () => {
    await repository.createInvitationToken(
      "invited@test.com",
      "barbershop-1",
      "BARBER" as any,
      TOKEN_HASH,
      new Date(Date.now() + 100_000),
    );

    await useCase.execute(RAW_TOKEN, "John", "Str0ng!Pass");
    expect(repository.staff).toHaveLength(1);

    await expect(
      useCase.execute(RAW_TOKEN, "John Again", "Str0ng!Pass"),
    ).rejects.toThrow("Convite inválido ou expirado");

    expect(repository.staff).toHaveLength(1);
  });
});
