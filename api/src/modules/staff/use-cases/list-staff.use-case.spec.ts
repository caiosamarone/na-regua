/// <reference types="jest" />
import { InMemoryStaffRepository } from "../../../tests/helpers/in-memory-staff.repository";
import { ListStaffUseCase } from "./list-staff.use-case";

describe("ListStaffUseCase", () => {
  let repository: InMemoryStaffRepository;
  let useCase: ListStaffUseCase;

  beforeEach(() => {
    repository = new InMemoryStaffRepository();
    useCase = new ListStaffUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should return only active staff by default", async () => {
    repository.staff.push(
      { id: "s1", barbershopId: "shop-1", email: "joao@test.com", passwordHash: "hash", name: "João", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null, createdAt: new Date(), updatedAt: new Date() },
      { id: "s2", barbershopId: "shop-1", email: "inativo@test.com", passwordHash: "hash", name: "Inativo", role: "BARBER", isBookable: true, isActive: false, avatarUrl: null, createdAt: new Date(), updatedAt: new Date() },
    );
    const result = await useCase.execute("shop-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
  });

  it("should return all staff when includeInactive is true", async () => {
    repository.staff.push(
      { id: "s1", barbershopId: "shop-1", email: "joao@test.com", passwordHash: "hash", name: "João", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null, createdAt: new Date(), updatedAt: new Date() },
      { id: "s2", barbershopId: "shop-1", email: "inativo@test.com", passwordHash: "hash", name: "Inativo", role: "BARBER", isBookable: true, isActive: false, avatarUrl: null, createdAt: new Date(), updatedAt: new Date() },
    );
    const result = await useCase.execute("shop-1", true);
    expect(result).toHaveLength(2);
  });
});
