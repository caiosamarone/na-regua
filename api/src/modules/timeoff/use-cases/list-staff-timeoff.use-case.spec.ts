import { InMemoryTimeOffRepository } from "../../../tests/helpers/in-memory-timeoff.repository";
import { ListStaffTimeOffUseCase } from "./list-staff-timeoff.use-case";

describe("ListStaffTimeOffUseCase", () => {
  let repo: InMemoryTimeOffRepository;
  let useCase: ListStaffTimeOffUseCase;

  beforeEach(() => {
    repo = new InMemoryTimeOffRepository();
    useCase = new ListStaffTimeOffUseCase(repo);
  });

  it("should return timeoffs for the staff member", async () => {
    const now = new Date();
    await repo.create({ barbershopId: "shop-1", staffMemberId: "staff-1", startDate: now, endDate: now, startTime: null, endTime: null });
    await repo.create({ barbershopId: "shop-1", staffMemberId: "staff-2", startDate: now, endDate: now, startTime: null, endTime: null });

    const result = await useCase.execute("staff-1");

    expect(result).toHaveLength(1);
    expect(result[0].staffMemberId).toBe("staff-1");
  });

  it("should return empty array when no timeoffs", async () => {
    const result = await useCase.execute("staff-1");
    expect(result).toEqual([]);
  });
});
