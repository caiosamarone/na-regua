/// <reference types="jest" />
import { InMemoryStaffRepository } from "../../../tests/helpers/in-memory-staff.repository";
import { InviteStaffUseCase } from "./invite-staff.use-case";

class MockEmailService {
  sendInvite = jest.fn().mockResolvedValue(undefined);
}

describe("InviteStaffUseCase", () => {
  let repository: InMemoryStaffRepository;
  let emailService: MockEmailService;
  let useCase: InviteStaffUseCase;

  beforeEach(() => {
    repository = new InMemoryStaffRepository();
    emailService = new MockEmailService();
    useCase = new InviteStaffUseCase(repository, emailService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should send invite for new staff", async () => {
    const result = await useCase.execute("shop-1", "novo@test.com", "Novo", "BARBER");
    expect(result.message).toBe("Convite enviado");
    expect(emailService.sendInvite).toHaveBeenCalledTimes(1);
  });

  it("should throw StaffEmailAlreadyExistsError when email exists", async () => {
    repository.staff.push({
      id: "s1", barbershopId: "shop-1", email: "existente@test.com", passwordHash: "hash", name: "Existente", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null, createdAt: new Date(), updatedAt: new Date(),
    });
    await expect(useCase.execute("shop-1", "existente@test.com", "Novo", "BARBER")).rejects.toThrow("Email já cadastrado");
  });
});
