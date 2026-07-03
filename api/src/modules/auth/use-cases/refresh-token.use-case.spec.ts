/// <reference types="jest" />

import type { JwtService } from "../../../shared/services/jwt.service";
import { hashToken, randomHex } from "../../../shared/helpers/token.helper";
import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { RefreshTokenUseCase } from "./refresh-token.use-case";

const RAW_TOKEN = randomHex(32);
const TOKEN_HASH = hashToken(RAW_TOKEN);
const FAMILY = "test-family-refresh";
const STAFF_ID = "staff-1";

describe("RefreshTokenUseCase", () => {
  let repository: InMemoryAuthRepository;
  let jwtService: jest.Mocked<JwtService>;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    jwtService = {
      signAccessToken: jest.fn().mockReturnValue("mock-access-token"),
      verifyAccessToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    useCase = new RefreshTokenUseCase(repository, jwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should rotate tokens successfully for a staff member", async () => {
    repository.staff.push({
      id: STAFF_ID,
      barbershopId: "barbershop-1",
      email: "barber@test.com",
      passwordHash: "hash",
      name: "Barber",
      role: "BARBER",
      isBookable: true,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await repository.createRefreshToken({
      tokenHash: TOKEN_HASH,
      family: FAMILY,
      staffMemberId: STAFF_ID,
      expiresAt: new Date(Date.now() + 100_000),
    });

    const result = await useCase.execute(RAW_TOKEN);

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshToken).not.toBe(RAW_TOKEN);

    const stored = repository.refreshTokens;
    expect(stored[0].revoked).toBe(true);
    expect(stored[1].tokenHash).toBe(hashToken(result.refreshToken));
    expect(stored[1].family).toBe(FAMILY);
    expect(stored[1].staffMemberId).toBe(STAFF_ID);
  });

  it("should rotate tokens for a customer", async () => {
    const CUSTOMER_ID = "cust-1";
    repository.customers.push({
      id: CUSTOMER_ID,
      email: "customer@test.com",
      name: "Customer",
      googleId: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await repository.createRefreshToken({
      tokenHash: TOKEN_HASH,
      family: FAMILY,
      customerId: CUSTOMER_ID,
      expiresAt: new Date(Date.now() + 100_000),
    });

    const result = await useCase.execute(RAW_TOKEN);

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toBeTruthy();

    const stored = repository.refreshTokens;
    expect(stored[0].revoked).toBe(true);
    expect(stored[1].customerId).toBe(CUSTOMER_ID);
  });

  it("should throw when token does not exist", async () => {
    await expect(useCase.execute("non-existent")).rejects.toThrow("Refresh token inválido ou expirado");
  });

  it("should revoke entire family and throw when token is reused (already revoked)", async () => {
    await repository.createRefreshToken({
      tokenHash: hashToken("sibling-1"),
      family: FAMILY,
      staffMemberId: STAFF_ID,
      expiresAt: new Date(Date.now() + 100_000),
    });

    await repository.createRefreshToken({
      tokenHash: TOKEN_HASH,
      family: FAMILY,
      staffMemberId: STAFF_ID,
      expiresAt: new Date(Date.now() + 100_000),
    });

    repository.refreshTokens[1].revoked = true;

    await expect(useCase.execute(RAW_TOKEN)).rejects.toThrow(
      "Refresh token reutilizado — todas as sessões foram invalidadas",
    );

    expect(repository.refreshTokens[0].revoked).toBe(true);
    expect(repository.refreshTokens[1].revoked).toBe(true);
  });

  it("should sign access token with correct staff payload", async () => {
    repository.staff.push({
      id: STAFF_ID,
      barbershopId: "barbershop-1",
      email: "barber@test.com",
      passwordHash: "hash",
      name: "Barber",
      role: "BARBER",
      isBookable: true,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await repository.createRefreshToken({
      tokenHash: TOKEN_HASH,
      family: FAMILY,
      staffMemberId: STAFF_ID,
      expiresAt: new Date(Date.now() + 100_000),
    });

    await useCase.execute(RAW_TOKEN);

    expect(jwtService.signAccessToken).toHaveBeenCalledWith({
      sub: STAFF_ID,
      role: "BARBER",
      barbershopId: "barbershop-1",
    });
  });

  it("should sign access token with correct customer payload", async () => {
    const CUSTOMER_ID = "cust-1";

    await repository.createRefreshToken({
      tokenHash: TOKEN_HASH,
      family: FAMILY,
      customerId: CUSTOMER_ID,
      expiresAt: new Date(Date.now() + 100_000),
    });

    await useCase.execute(RAW_TOKEN);

    expect(jwtService.signAccessToken).toHaveBeenCalledWith({
      sub: CUSTOMER_ID,
      role: "CUSTOMER",
    });
  });
});
