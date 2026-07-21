import { InMemoryTimeOffRepository } from "../../../tests/helpers/in-memory-timeoff.repository";
import { DeleteTimeOffUseCase } from "./delete-timeoff.use-case";
import { TimeOffNotFoundError, NotYourTimeOffError } from "../errors/timeoff-errors";

describe("DeleteTimeOffUseCase", () => {
  let repo: InMemoryTimeOffRepository;
  let useCase: DeleteTimeOffUseCase;

  beforeEach(() => {
    repo = new InMemoryTimeOffRepository();
    useCase = new DeleteTimeOffUseCase(repo);
  });

  it("should delete a timeoff entry", async () => {
    await repo.create({ barbershopId: "shop-1", staffMemberId: "staff-1", startDate: new Date(), endDate: new Date(), startTime: null, endTime: null });
    const id = repo.timeOffs[0].id;

    await useCase.execute(id);

    expect(repo.timeOffs).toHaveLength(0);
  });

  it("should throw when timeoff does not exist", async () => {
    await expect(useCase.execute("invalid")).rejects.toThrow(TimeOffNotFoundError);
  });

  it("should throw when BARBER tries to delete another staff's timeoff", async () => {
    await repo.create({ barbershopId: "shop-1", staffMemberId: "staff-1", startDate: new Date(), endDate: new Date(), startTime: null, endTime: null });
    const id = repo.timeOffs[0].id;

    await expect(useCase.execute(id, "staff-2")).rejects.toThrow(NotYourTimeOffError);
  });

  it("should allow BARBER to delete own timeoff", async () => {
    await repo.create({ barbershopId: "shop-1", staffMemberId: "staff-1", startDate: new Date(), endDate: new Date(), startTime: null, endTime: null });
    const id = repo.timeOffs[0].id;

    await useCase.execute(id, "staff-1");

    expect(repo.timeOffs).toHaveLength(0);
  });

  it("should allow admin to delete any timeoff without staffMemberId", async () => {
    await repo.create({ barbershopId: "shop-1", staffMemberId: "staff-1", startDate: new Date(), endDate: new Date(), startTime: null, endTime: null });
    const id = repo.timeOffs[0].id;

    await useCase.execute(id);

    expect(repo.timeOffs).toHaveLength(0);
  });
});
