/// <reference types="jest" />
import { InMemoryStaffRepository } from "../../../tests/helpers/in-memory-staff.repository";
import { ToggleBookableUseCase } from "./toggle-bookable.use-case";

describe("ToggleBookableUseCase", () => {
  let repository: InMemoryStaffRepository;
  let useCase: ToggleBookableUseCase;

  beforeEach(() => {
    repository = new InMemoryStaffRepository();
    useCase = new ToggleBookableUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should toggle bookable flag", async () => {
    repository.staff.push({
      id: "s1", barbershopId: "shop-1", email: "joao@test.com", passwordHash: "hash", name: "João", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null, createdAt: new Date(), updatedAt: new Date(),
    });
    const result = await useCase.execute("s1", false);
    expect(result.isBookable).toBe(false);
  });

  it("should throw StaffNotFoundError when staff does not exist", async () => {
    await expect(useCase.execute("non-existent", false)).rejects.toThrow("Profissional não encontrado");
  });
});
