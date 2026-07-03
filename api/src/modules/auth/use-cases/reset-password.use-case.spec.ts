/// <reference types="jest" />

import { hashToken } from "../../../shared/helpers/token.helper";
import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { ResetPasswordUseCase } from "./reset-password.use-case";

jest.mock("../../../shared/helpers/password.helper", () => ({
  hashPassword: jest.fn().mockResolvedValue("$2a$10$mocked-hash"),
}));

import { hashPassword } from "../../../shared/helpers/password.helper";

const OTP_CODE = "123456";
const OTP_HASH = hashToken(OTP_CODE);
const STAFF_ID = "staff-1";

describe("ResetPasswordUseCase", () => {
  let repository: InMemoryAuthRepository;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    useCase = new ResetPasswordUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should reset password when OTP is valid", async () => {
    repository.staff.push({
      id: STAFF_ID,
      barbershopId: "shop-1",
      email: "admin@test.com",
      passwordHash: "$2a$10$old-hash",
      name: "Admin",
      role: "BARBERSHOP_ADMIN",
      isBookable: false,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await repository.createOtpToken({
      codeHash: OTP_HASH,
      staffMemberId: STAFF_ID,
      expiresAt: new Date(Date.now() + 100_000),
    });

    await useCase.execute("admin@test.com", OTP_CODE, "NewP@ss1");

    expect(hashPassword).toHaveBeenCalledWith("NewP@ss1");
    expect(
      (repository.staff[0] as any).passwordHash,
    ).toBe("$2a$10$mocked-hash");
    expect(repository.otpTokens[0].consumedAt).toBeTruthy();
  });

  it("should throw when OTP is invalid", async () => {
    await expect(
      useCase.execute("admin@test.com", "000000", "NewP@ss1"),
    ).rejects.toThrow("OTP inválido ou expirado");
  });

  it("should throw when staff email does not match OTP owner", async () => {
    repository.staff.push({
      id: STAFF_ID,
      barbershopId: "shop-1",
      email: "other@test.com",
      passwordHash: "$2a$10$hash",
      name: "Other",
      role: "BARBER",
      isBookable: true,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await repository.createOtpToken({
      codeHash: OTP_HASH,
      staffMemberId: STAFF_ID,
      expiresAt: new Date(Date.now() + 100_000),
    });

    await expect(
      useCase.execute("wrong@test.com", OTP_CODE, "NewP@ss1"),
    ).rejects.toThrow("OTP inválido ou expirado");
  });
});
