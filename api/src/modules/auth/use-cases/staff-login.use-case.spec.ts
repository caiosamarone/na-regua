import type { JwtService } from "../../../shared/services/jwt.service";
import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import { StaffLoginUseCase } from "./staff-login.use-case";
import { comparePasswords } from "../../../shared/helpers/password.helper";

jest.mock("../../../shared/helpers/password.helper", () => ({
  comparePasswords: jest.fn(),
}));

describe("StaffLoginUseCase", () => {
  let repository: InMemoryAuthRepository;
  let jwtService: jest.Mocked<JwtService>;
  let useCase: StaffLoginUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    jwtService = {
      signAccessToken: jest.fn().mockReturnValue("mock-access-token"),
      verifyAccessToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    useCase = new StaffLoginUseCase(repository, jwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should login successfully with valid credentials", async () => {
    (comparePasswords as unknown as jest.Mock).mockResolvedValue(true);
    repository.staff.push({
      id: "staff-1",
      barbershopId: "shop-1",
      email: "admin@test.com",
      passwordHash: "$2a$10$hashed",
      name: "Admin",
      role: "BARBERSHOP_ADMIN",
      isBookable: false,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute("admin@test.com", "valid-password");

    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toBeTruthy();
    expect(result.staff.id).toBe("staff-1");
    expect(jwtService.signAccessToken).toHaveBeenCalledWith({
      sub: "staff-1",
      role: "BARBERSHOP_ADMIN",
      barbershopId: "shop-1",
    });
  });

  it("should throw UnauthorizedError when email does not exist", async () => {
    await expect(
      useCase.execute("nonexistent@test.com", "any-password"),
    ).rejects.toThrow("Credenciais inválidas");
  });

  it("should throw UnauthorizedError when password is wrong", async () => {
    (comparePasswords as unknown as jest.Mock).mockResolvedValue(false);
    repository.staff.push({
      id: "staff-2",
      barbershopId: "shop-1",
      email: "user@test.com",
      passwordHash: "$2a$10$different",
      name: "User",
      role: "BARBER",
      isBookable: true,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      useCase.execute("user@test.com", "wrong-password"),
    ).rejects.toThrow("Credenciais inválidas");
  });
});
