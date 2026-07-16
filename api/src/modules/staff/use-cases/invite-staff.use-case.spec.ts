/// <reference types="jest" />
import { InMemoryStaffRepository } from "../../../tests/helpers/in-memory-staff.repository";
import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { InviteStaffUseCase } from "./invite-staff.use-case";

class MockEmailService {
  sendInvite = jest.fn().mockResolvedValue(undefined);
}

describe("InviteStaffUseCase", () => {
  let staffRepository: InMemoryStaffRepository;
  let authRepository: InMemoryAuthRepository;
  let emailService: MockEmailService;
  let useCase: InviteStaffUseCase;

  beforeEach(() => {
    staffRepository = new InMemoryStaffRepository();
    authRepository = new InMemoryAuthRepository();
    emailService = new MockEmailService();
    useCase = new InviteStaffUseCase(staffRepository, authRepository, emailService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    staffRepository.reset();
    authRepository.reset();
  });

  it("should send invite and persist token for new staff", async () => {
    const result = await useCase.execute("shop-1", "novo@test.com", "Novo", "BARBER");

    expect(result.message).toBe("Convite enviado");
    expect(emailService.sendInvite).toHaveBeenCalledTimes(1);
    expect(authRepository.invitationTokens).toHaveLength(1);
    expect(authRepository.invitationTokens[0].email).toBe("novo@test.com");
    expect(authRepository.invitationTokens[0].barbershopId).toBe("shop-1");
    expect(authRepository.invitationTokens[0].role).toBe("BARBER");
    expect(authRepository.invitationTokens[0].consumedAt).toBeNull();
  });

  it("should throw StaffEmailAlreadyExistsError when email exists", async () => {
    staffRepository.staff.push({
      id: "s1", barbershopId: "shop-1", email: "existente@test.com", passwordHash: "hash", name: "Existente", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null, createdAt: new Date(), updatedAt: new Date(),
    });
    await expect(useCase.execute("shop-1", "existente@test.com", "Novo", "BARBER")).rejects.toThrow("Email já cadastrado");
    expect(authRepository.invitationTokens).toHaveLength(0);
  });
});
