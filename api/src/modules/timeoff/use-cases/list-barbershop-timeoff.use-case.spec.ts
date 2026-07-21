import { InMemoryTimeOffRepository } from "../../../tests/helpers/in-memory-timeoff.repository";
import { ListBarbershopTimeOffUseCase } from "./list-barbershop-timeoff.use-case";

describe("ListBarbershopTimeOffUseCase", () => {
  let repo: InMemoryTimeOffRepository;
  let useCase: ListBarbershopTimeOffUseCase;

  beforeEach(() => {
    repo = new InMemoryTimeOffRepository();
    useCase = new ListBarbershopTimeOffUseCase(repo);
  });

  it("should return all timeoffs for the barbershop", async () => {
    const now = new Date();
    await repo.create({ barbershopId: "shop-1", staffMemberId: "staff-1", startDate: now, endDate: now, startTime: null, endTime: null });
    await repo.create({ barbershopId: "shop-1", staffMemberId: "staff-2", startDate: now, endDate: now, startTime: null, endTime: null });
    await repo.create({ barbershopId: "shop-2", staffMemberId: "staff-3", startDate: now, endDate: now, startTime: null, endTime: null });

    const result = await useCase.execute("shop-1");

    expect(result).toHaveLength(2);
  });

  it("should return empty array when no timeoffs", async () => {
    const result = await useCase.execute("shop-1");
    expect(result).toEqual([]);
  });
});
