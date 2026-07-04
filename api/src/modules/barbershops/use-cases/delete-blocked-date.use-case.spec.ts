/// <reference types="jest" />

import { InMemoryBarbershopRepository } from "../../../tests/helpers/in-memory-barbershop.repository";
import { DeleteBlockedDateUseCase } from "./delete-blocked-date.use-case";

describe("DeleteBlockedDateUseCase", () => {
  let repository: InMemoryBarbershopRepository;
  let useCase: DeleteBlockedDateUseCase;

  beforeEach(() => {
    repository = new InMemoryBarbershopRepository();
    useCase = new DeleteBlockedDateUseCase(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.reset();
  });

  it("should delete blocked date successfully", async () => {
    repository.blockedDates.push({
      id: "bd-1",
      barbershopId: "shop-1",
      startDate: new Date("2026-07-05T00:00:00Z"),
      endDate: new Date("2026-07-07T00:00:00Z"),
      reason: "Feriado",
      createdAt: new Date(),
    });

    expect(repository.blockedDates).toHaveLength(1);

    await useCase.execute("bd-1");

    expect(repository.blockedDates).toHaveLength(0);
  });
});
