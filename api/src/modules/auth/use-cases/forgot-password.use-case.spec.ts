/// <reference types="jest" />

import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { ForgotPasswordUseCase } from "./forgot-password.use-case";
import type { EmailService } from "../../../shared/services/email.service";

describe("ForgotPasswordUseCase", () => {
  let repository: InMemoryAuthRepository;
  let emailService: jest.Mocked<EmailService>;
  let useCase: ForgotPasswordUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    emailService = {
      sendMagicLink: jest.fn(),
      sendInvite: jest.fn(),
      sendOtp: jest.fn(),
      sendCancellation: jest.fn(),
      sendBookingConfirmation: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;
    useCase = new ForgotPasswordUseCase(repository, emailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should send OTP when staff exists", async () => {
    repository.staff.push({
      id: "staff-1",
      barbershopId: "shop-1",
      email: "admin@test.com",
      passwordHash: "$2a$10$hash",
      name: "Admin",
      role: "BARBERSHOP_ADMIN",
      isBookable: false,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await useCase.execute("admin@test.com");

    expect(emailService.sendOtp).toHaveBeenCalledWith(
      "admin@test.com",
      expect.stringMatching(/^\d{6}$/),
    );
    expect(repository.otpTokens).toHaveLength(1);
    expect(repository.otpTokens[0].staffMemberId).toBe("staff-1");
  });

  it("should not send OTP when staff does not exist", async () => {
    await useCase.execute("nonexistent@test.com");

    expect(emailService.sendOtp).not.toHaveBeenCalled();
    expect(repository.otpTokens).toHaveLength(0);
  });
});
