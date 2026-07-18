import { InMemoryCommissionRepository } from "../../../tests/helpers/in-memory-commission.repository";
import { CreateCommissionEntryUseCase } from "./create-commission-entry.use-case";
import { CommissionAlreadyExistsError } from "../errors/commission-errors";

describe("CreateCommissionEntryUseCase", () => {
  let repo: InMemoryCommissionRepository;
  let useCase: CreateCommissionEntryUseCase;

  beforeEach(() => {
    repo = new InMemoryCommissionRepository();
    useCase = new CreateCommissionEntryUseCase(repo);
  });

  afterEach(() => {
    repo.reset();
  });

  it("should create a commission entry", async () => {
    const result = await useCase.execute("shop-1", "staff-1", "apt-1", 100, 50);

    expect(result).not.toBeNull();
    expect((result as any).staffMemberId).toBe("staff-1");
    expect((result as any).appointmentId).toBe("apt-1");
    expect(Number((result as any).amount)).toBe(50);
    expect((result as any).status).toBe("PENDING");
  });

  it("should return null when commissionPercent is 0 or null", async () => {
    const result1 = await useCase.execute("shop-1", "staff-1", "apt-1", 100, 0);
    expect(result1).toBeNull();

    const result2 = await useCase.execute("shop-1", "staff-1", "apt-2", 100, 0);
    expect(result2).toBeNull();
  });

  it("should calculate amount correctly", async () => {
    const result = await useCase.execute("shop-1", "staff-1", "apt-1", 80, 25);
    expect(Number((result as any).amount)).toBe(20);
  });

  it("should throw when commission already exists for appointment", async () => {
    await useCase.execute("shop-1", "staff-1", "apt-1", 100, 50);
    await expect(
      useCase.execute("shop-1", "staff-1", "apt-1", 100, 50),
    ).rejects.toThrow(CommissionAlreadyExistsError);
  });
});
