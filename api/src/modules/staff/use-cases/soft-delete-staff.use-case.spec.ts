/// <reference types="jest" />
import { InMemoryStaffRepository } from "../../../tests/helpers/in-memory-staff.repository";
import { SoftDeleteStaffUseCase } from "./soft-delete-staff.use-case";

describe("SoftDeleteStaffUseCase", () => {
  let repository: InMemoryStaffRepository;
  let useCase: SoftDeleteStaffUseCase;

  beforeEach(() => {
    repository = new InMemoryStaffRepository();
    useCase = new SoftDeleteStaffUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should soft delete staff when no future bookings", async () => {
    repository.staff.push({
      id: "s1", barbershopId: "shop-1", email: "joao@test.com", passwordHash: "hash", name: "João", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null, createdAt: new Date(), updatedAt: new Date(),
    });
    await useCase.execute("s1");
    expect(repository.staff[0].isActive).toBe(false);
  });

  it("should throw StaffHasFutureBookingsError when staff has future bookings", async () => {
    repository.staff.push({
      id: "s1", barbershopId: "shop-1", email: "joao@test.com", passwordHash: "hash", name: "João", role: "BARBER", isBookable: true, isActive: true, avatarUrl: null, createdAt: new Date(), updatedAt: new Date(),
    });
    repository.futureBookings.push(
      { id: "apt-1", startTime: new Date("2099-01-01"), customerId: "cust-1", barberId: "s1" },
    );
    await expect(useCase.execute("s1")).rejects.toThrow("Staff member has future appointments");
  });

  it("should throw StaffNotFoundError when staff does not exist", async () => {
    await expect(useCase.execute("non-existent")).rejects.toThrow("Profissional não encontrado");
  });
});
