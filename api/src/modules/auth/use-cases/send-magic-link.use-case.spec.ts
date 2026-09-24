/// <reference types="jest" />

import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { SendMagicLinkUseCase } from "./send-magic-link.use-case";
import type { EmailService } from "../../../shared/services/email.service";

describe("SendMagicLinkUseCase", () => {
  let repository: InMemoryAuthRepository;
  let emailService: jest.Mocked<EmailService>;
  let useCase: SendMagicLinkUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    emailService = {
      sendMagicLink: jest.fn(),
      sendInvite: jest.fn(),
      sendOtp: jest.fn(),
      sendCancellationConfirmation: jest.fn(),
      sendBookingConfirmation: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;
    useCase = new SendMagicLinkUseCase(
      repository,
      emailService,
      "https://app.naregua.app",
      "naregua://auth/magic-link",
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should create token and send email when customer exists", async () => {
    await repository.createCustomer({
      email: "user@test.com",
      name: "User",
    });

    await useCase.execute("user@test.com");

    expect(emailService.sendMagicLink).toHaveBeenCalledWith(
      "user@test.com",
      expect.stringContaining("token="),
    );
    expect(repository.magicLinkTokens).toHaveLength(1);
    expect(repository.magicLinkTokens[0].customerId).toBeTruthy();
  });

  it("should create customer and send email when email does not exist", async () => {
    await useCase.execute("new@test.com");

    expect(emailService.sendMagicLink).toHaveBeenCalledWith(
      "new@test.com",
      expect.stringContaining("token="),
    );
    expect(repository.magicLinkTokens).toHaveLength(1);
    expect(repository.customers).toHaveLength(1);
    expect(repository.customers[0].email).toBe("new@test.com");
  });

  it("should link to the webapp by default", async () => {
    await useCase.execute("user@test.com");

    expect(emailService.sendMagicLink).toHaveBeenCalledWith(
      "user@test.com",
      expect.stringMatching(/^https:\/\/app\.naregua\.app\/auth\/magic-link\?token=[0-9a-f]+$/),
    );
  });

  it("should link to the mobile app when client is mobile", async () => {
    await useCase.execute("user@test.com", "mobile");

    expect(emailService.sendMagicLink).toHaveBeenCalledWith(
      "user@test.com",
      expect.stringMatching(/^naregua:\/\/auth\/magic-link\?token=[0-9a-f]+$/),
    );
  });
});
