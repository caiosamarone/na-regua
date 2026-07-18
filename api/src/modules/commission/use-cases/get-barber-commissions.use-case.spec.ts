import { InMemoryCommissionRepository } from "../../../tests/helpers/in-memory-commission.repository";
import { GetBarberCommissionsUseCase } from "./get-barber-commissions.use-case";
import { StaffRole } from "../../../generated/prisma/client";

describe("GetBarberCommissionsUseCase", () => {
  let repo: InMemoryCommissionRepository;
  let useCase: GetBarberCommissionsUseCase;

  const shopId = "shop-1";
  const staffId = "staff-1";

  beforeEach(() => {
    repo = new InMemoryCommissionRepository();
    useCase = new GetBarberCommissionsUseCase(repo);

    repo.staff.push({
      id: staffId,
      barbershopId: shopId,
      name: "João",
      role: "BARBER" as StaffRole,
      commissionPercent: 50 as any,
      isActive: true,
    } as any);
  });

  afterEach(() => {
    repo.reset();
  });

  it("should return zeros when no entries", async () => {
    const result = await useCase.execute({ staffMemberId: staffId, barbershopId: shopId });

    expect(result.totalGenerated).toBe(0);
    expect(result.pendingAmount).toBe(0);
    expect(result.paidAmount).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it("should return totals correctly", async () => {
    repo.entries.push(
      {
        id: "e1", staffMemberId: staffId, barbershopId: shopId, amount: 50 as any, status: "PENDING",
        appointment: { startTime: new Date(), priceAtBooking: 100 as any, service: { name: "Corte" }, customer: { name: "João" } },
        paidAt: null,
      } as any,
      {
        id: "e2", staffMemberId: staffId, barbershopId: shopId, amount: 30 as any, status: "PAID", paidAt: new Date(),
        appointment: { startTime: new Date(), priceAtBooking: 60 as any, service: { name: "Barba" }, customer: { name: "Maria" } },
      } as any,
    );

    const result = await useCase.execute({ staffMemberId: staffId, barbershopId: shopId });

    expect(result.totalGenerated).toBe(80);
    expect(result.pendingAmount).toBe(50);
    expect(result.paidAmount).toBe(30);
    expect(result.entries[0].serviceName).toBe("Corte");
    expect(result.entries[0].customerName).toBe("João");
    expect(result.entries[0].paidAt).toBeNull();
    expect(result.entries[1].serviceName).toBe("Barba");
    expect(result.entries[1].customerName).toBe("Maria");
    expect(result.entries[1].paidAt).toBeTruthy();
  });

  it("should return commission percent from staff", async () => {
    const result = await useCase.execute({ staffMemberId: staffId, barbershopId: shopId });
    expect(result.commissionPercent).toBe(50);
  });
});
