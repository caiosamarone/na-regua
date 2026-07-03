/// <reference types="jest" />

import { hashToken } from "../../../shared/helpers/token.helper";
import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { StaffLogoutUseCase } from "./staff-logout.use-case";

const RAW_TOKEN = "test-raw-token-32-chars!!";
const TOKEN_HASH = hashToken(RAW_TOKEN);
const FAMILY = "test-family-123";

describe("StaffLogoutUseCase", () => {
  let repository: InMemoryAuthRepository;
  let useCase: StaffLogoutUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    useCase = new StaffLogoutUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should revoke a single refresh token", async () => {
    await repository.createRefreshToken({
      tokenHash: TOKEN_HASH,
      family: FAMILY,
      staffMemberId: "staff-1",
      expiresAt: new Date(Date.now() + 100_000),
    });

    expect(repository.refreshTokens[0].revoked).toBe(false);

    await useCase.execute(RAW_TOKEN);

    expect(repository.refreshTokens[0].revoked).toBe(true);
  });

  it("should revoke all tokens in the same family when allDevices is true", async () => {
    await repository.createRefreshToken({
      tokenHash: hashToken("token-a"),
      family: FAMILY,
      staffMemberId: "staff-1",
      expiresAt: new Date(Date.now() + 100_000),
    });
    await repository.createRefreshToken({
      tokenHash: hashToken("token-b"),
      family: FAMILY,
      staffMemberId: "staff-1",
      expiresAt: new Date(Date.now() + 100_000),
    });

    const otherFamilyHash = hashToken("other");
    await repository.createRefreshToken({
      tokenHash: otherFamilyHash,
      family: "other-family",
      staffMemberId: "staff-1",
      expiresAt: new Date(Date.now() + 100_000),
    });
    await repository.createRefreshToken({
      tokenHash: TOKEN_HASH,
      family: FAMILY,
      staffMemberId: "staff-1",
      expiresAt: new Date(Date.now() + 100_000),
    });

    await useCase.execute(RAW_TOKEN, true);

    const familyTokens = repository.refreshTokens.filter((t) => t.family === FAMILY);
    expect(familyTokens).toHaveLength(3);
    for (const t of familyTokens) {
      expect(t.revoked).toBe(true);
    }

    const otherToken = repository.refreshTokens.find((t) => t.tokenHash === otherFamilyHash);
    expect(otherToken?.revoked).toBe(false);
  });

  it("should be idempotent when token does not exist", async () => {
    await expect(useCase.execute("non-existent-token")).resolves.not.toThrow();
  });

  it("should be idempotent when token is already revoked", async () => {
    await repository.createRefreshToken({
      tokenHash: TOKEN_HASH,
      family: FAMILY,
      staffMemberId: "staff-1",
      expiresAt: new Date(Date.now() + 100_000),
    });

    await useCase.execute(RAW_TOKEN);
    expect(repository.refreshTokens[0].revoked).toBe(true);

    await useCase.execute(RAW_TOKEN);
    expect(repository.refreshTokens[0].revoked).toBe(true);
  });
});
