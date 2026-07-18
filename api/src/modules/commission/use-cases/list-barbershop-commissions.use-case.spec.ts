import { InMemoryCommissionRepository } from "../../../tests/helpers/in-memory-commission.repository";
import { ListBarbershopCommissionsUseCase } from "./list-barbershop-commissions.use-case";
import { StaffRole } from "../../../generated/prisma/client";

describe("ListBarbershopCommissionsUseCase", () => {
  let repo: InMemoryCommissionRepository;
  let useCase: ListBarbershopCommissionsUseCase;

  const shopId = "shop-1";

  beforeEach(() => {
    repo = new InMemoryCommissionRepository();
    useCase = new ListBarbershopCommissionsUseCase(repo);

    repo.staff.push(
      { id: "staff-1", barbershopId: shopId, name: "João", role: "BARBER" as StaffRole, commissionPercent: 50 as any, isActive: true } as any,
      { id: "staff-2", barbershopId: shopId, name: "Pedro", role: "BARBER" as StaffRole, commissionPercent: 40 as any, isActive: true } as any,
    );
  });

  afterEach(() => {
    repo.reset();
  });

  it("should return empty list when no commissions", async () => {
    const result = await useCase.execute({ barbershopId: shopId });
    expect(result.barbers).toHaveLength(2);
    expect(result.barbers[0].pendingAmount).toBe(0);
  });

  it("should aggregate commissions per barber", async () => {
    await useCase.execute({ barbershopId: shopId });

    repo.entries.push(
      { id: "e1", staffMemberId: "staff-1", barbershopId: shopId, amount: 50 as any, status: "PENDING", paidAt: null } as any,
      { id: "e2", staffMemberId: "staff-1", barbershopId: shopId, amount: 30 as any, status: "PENDING", paidAt: null } as any,
      { id: "e3", staffMemberId: "staff-2", barbershopId: shopId, amount: 40 as any, status: "PENDING", paidAt: null } as any,
    );

    const result = await useCase.execute({ barbershopId: shopId });
    const joao = result.barbers.find((b) => b.staffMemberId === "staff-1")!;
    const pedro = result.barbers.find((b) => b.staffMemberId === "staff-2")!;

    expect(joao.pendingAmount).toBe(80);
    expect(joao.pendingEntries).toBe(2);
    expect(pedro.pendingAmount).toBe(40);
    expect(pedro.pendingEntries).toBe(1);
  });

  it("should filter by barberId", async () => {
    repo.entries.push(
      { id: "e1", staffMemberId: "staff-1", barbershopId: shopId, amount: 50 as any, status: "PENDING" } as any,
    );

    const result = await useCase.execute({ barbershopId: shopId, barberId: "staff-1" });
    expect(result.barbers).toHaveLength(1);
    expect(result.barbers[0].staffMemberId).toBe("staff-1");
  });
});
