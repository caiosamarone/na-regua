/// <reference types="jest" />

import { hashToken } from "../../../shared/helpers/token.helper";
import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { VerifyMagicLinkUseCase } from "./verify-magic-link.use-case";
import type { JwtService } from "../../../shared/services/jwt.service";

const RAW_TOKEN = "valid-magic-token";
const TOKEN_HASH = hashToken(RAW_TOKEN);

describe("VerifyMagicLinkUseCase", () => {
  let repository: InMemoryAuthRepository;
  let jwtService: jest.Mocked<JwtService>;
  let useCase: VerifyMagicLinkUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    jwtService = {
      signAccessToken: jest.fn().mockReturnValue("mock-access-token"),
      verifyAccessToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    useCase = new VerifyMagicLinkUseCase(repository, jwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should consume token and return tokens when valid", async () => {
    const customer = await repository.createCustomer({
      email: "user@test.com",
      name: "User",
    });

    await repository.createMagicLinkToken(
      customer.id,
      TOKEN_HASH,
      new Date(Date.now() + 100_000),
    );

    const result = await useCase.execute(RAW_TOKEN);

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toBeTruthy();
    expect(result.customer.id).toBe(customer.id);
    expect(result.customer.email).toBe("user@test.com");
    expect(result.customer.name).toBe("User");
    expect(jwtService.signAccessToken).toHaveBeenCalledWith({
      sub: customer.id,
      role: "CUSTOMER",
    });
  });

  it("should throw MagicLinkInvalidError when token is invalid", async () => {
    await expect(useCase.execute("invalid-token")).rejects.toThrow(
      "Magic link inválido ou expirado",
    );
  });

  it("should throw MagicLinkInvalidError when token is already consumed", async () => {
    const customer = await repository.createCustomer({
      email: "user@test.com",
      name: "User",
    });

    await repository.createMagicLinkToken(
      customer.id,
      TOKEN_HASH,
      new Date(Date.now() + 100_000),
    );

    await useCase.execute(RAW_TOKEN);

    await expect(useCase.execute(RAW_TOKEN)).rejects.toThrow(
      "Magic link inválido ou expirado",
    );
  });
});
