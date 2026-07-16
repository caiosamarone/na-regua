/// <reference types="jest" />
import { InMemoryStaffRepository } from "../../../tests/helpers/in-memory-staff.repository";
import { UpdateStaffUseCase } from "./update-staff.use-case";

describe("UpdateStaffUseCase", () => {
  let repository: InMemoryStaffRepository;
  let useCase: UpdateStaffUseCase;

  beforeEach(() => {
    repository = new InMemoryStaffRepository();
    useCase = new UpdateStaffUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should update staff name, role, and isBookable", async () => {
    repository.staff.push({
      id: "s1", barbershopId: "shop-1", email: "joao@test.com", passwordHash: "hash", name: "João", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null, createdAt: new Date(), updatedAt: new Date(),
    });
    const result = await useCase.execute("s1", { name: "João Silva", role: "BARBERSHOP_ADMIN", isBookable: false });
    expect(result.name).toBe("João Silva");
    expect(result.role).toBe("BARBERSHOP_ADMIN");
    expect(result.isBookable).toBe(false);
  });

  it("should throw StaffNotFoundError when staff does not exist", async () => {
    await expect(useCase.execute("non-existent", { name: "Teste" })).rejects.toThrow("Profissional não encontrado");
  });
});
