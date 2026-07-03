import { CustomerGoogleAuthUseCase } from "./customer-google-auth.use-case";
import { InMemoryAuthRepository } from "../../../tests/helpers/in-memory-auth.repository";
import type { GoogleAuthService } from "../../../shared/services/google.service";
import type { JwtService } from "../../../shared/services/jwt.service";

describe("CustomerGoogleAuthUseCase", () => {
  let repository: InMemoryAuthRepository;
  let jwtService: jest.Mocked<JwtService>;
  let googleService: jest.Mocked<GoogleAuthService>;
  let useCase: CustomerGoogleAuthUseCase;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    jwtService = {
      signAccessToken: jest.fn().mockReturnValue("mock-access-token"),
      verifyAccessToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    googleService = {
      verifyIdToken: jest.fn(),
    } as unknown as jest.Mocked<GoogleAuthService>;
    useCase = new CustomerGoogleAuthUseCase(
      repository,
      jwtService,
      googleService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should create a new customer when email does not exist", async () => {
    (googleService.verifyIdToken as jest.Mock).mockResolvedValue({
      email: "new@test.com",
      name: "New User",
    });

    const result = await useCase.execute("valid-google-token");

    expect(result.customer.email).toBe("new@test.com");
    expect(result.customer.name).toBe("New User");
    expect(result.accessToken).toBe("mock-access-token");
    expect(result.refreshToken).toBeTruthy();
    expect(jwtService.signAccessToken).toHaveBeenCalledWith({
      sub: result.customer.id,
      role: "CUSTOMER",
    });
    expect(repository.customers).toHaveLength(1);
  });

  it("should return existing customer when email already exists", async () => {
    (googleService.verifyIdToken as jest.Mock).mockResolvedValue({
      email: "existing@test.com",
      name: "Existing User",
    });

    await repository.createCustomer({
      email: "existing@test.com",
      name: "Existing User",
    });

    const result = await useCase.execute("valid-google-token");

    expect(result.customer.email).toBe("existing@test.com");
    expect(repository.customers).toHaveLength(1);
  });

  it("should throw when Google token is invalid", async () => {
    (googleService.verifyIdToken as jest.Mock).mockRejectedValue(
      new Error("Email não verificado"),
    );

    await expect(useCase.execute("invalid-token")).rejects.toThrow(
      "Email não verificado",
    );
  });
});
