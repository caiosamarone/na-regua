import { InMemoryCommissionRepository } from "../../../tests/helpers/in-memory-commission.repository";
import { PayCommissionsUseCase } from "./pay-commissions.use-case";
import { InvalidPayInputError, NoPendingCommissionsError } from "../errors/commission-errors";

describe("PayCommissionsUseCase", () => {
  let repo: InMemoryCommissionRepository;
  let useCase: PayCommissionsUseCase;

  const shopId = "shop-1";

  beforeEach(() => {
    repo = new InMemoryCommissionRepository();
    useCase = new PayCommissionsUseCase(repo);
  });

  afterEach(() => {
    repo.reset();
  });

  it("should throw when no pending commissions", async () => {
    await expect(
      useCase.execute({ barbershopId: shopId, staffMemberId: "staff-1" }),
    ).rejects.toThrow(NoPendingCommissionsError);
  });

  it("should throw when neither staffMemberId nor payAll is provided", async () => {
    await expect(
      useCase.execute({ barbershopId: shopId }),
    ).rejects.toThrow(InvalidPayInputError);
  });

  it("should pay all pending for a specific barber", async () => {
    repo.entries.push(
      { id: "e1", staffMemberId: "staff-1", barbershopId: shopId, amount: 50 as any, status: "PENDING" } as any,
      { id: "e2", staffMemberId: "staff-1", barbershopId: shopId, amount: 30 as any, status: "PENDING" } as any,
      { id: "e3", staffMemberId: "staff-2", barbershopId: shopId, amount: 20 as any, status: "PENDING" } as any,
    );

    const result = await useCase.execute({ barbershopId: shopId, staffMemberId: "staff-1" });

    expect(result.staffMemberId).toBe("staff-1");
    expect(Number(result.amount)).toBe(80);

    const paid1 = repo.entries.find((e) => e.id === "e1")!;
    const paid2 = repo.entries.find((e) => e.id === "e2")!;
    const notPaid = repo.entries.find((e) => e.id === "e3")!;

    expect(paid1.status).toBe("PAID");
    expect(paid2.status).toBe("PAID");
    expect(notPaid.status).toBe("PENDING");
  });

  it("should pay all pending commissions when payAll is true", async () => {
    repo.entries.push(
      { id: "e1", staffMemberId: "staff-1", barbershopId: shopId, amount: 50 as any, status: "PENDING" } as any,
      { id: "e2", staffMemberId: "staff-2", barbershopId: shopId, amount: 30 as any, status: "PENDING" } as any,
    );

    const result = await useCase.execute({ barbershopId: shopId, payAll: true });

    expect(result.staffMemberId).toBeNull();
    expect(Number(result.amount)).toBe(80);

    expect(repo.entries.every((e) => e.status === "PAID")).toBe(true);
  });
});
