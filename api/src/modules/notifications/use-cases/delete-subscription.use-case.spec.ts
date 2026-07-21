import { InMemoryPushSubscriptionRepository } from "../../../tests/helpers/in-memory-push-subscription.repository";
import { DeleteSubscriptionUseCase } from "./delete-subscription.use-case";
import { SubscriptionNotFoundError, SubscriptionNotOwnedError } from "../errors/notification-errors";

describe("DeleteSubscriptionUseCase", () => {
  let repository: InMemoryPushSubscriptionRepository;
  let useCase: DeleteSubscriptionUseCase;

  beforeEach(async () => {
    repository = new InMemoryPushSubscriptionRepository();
    useCase = new DeleteSubscriptionUseCase(repository);

    await repository.create({
      customerId: "cust-1",
      endpoint: "https://example.com/push",
      keys: { p256dh: "key1", auth: "auth1" },
    });
  });

  afterEach(() => {
    repository.reset();
  });

  it("should delete a subscription owned by the customer", async () => {
    const subs = await repository.findByCustomerId("cust-1");

    await useCase.execute(subs[0].id, "cust-1");

    const remaining = await repository.findByCustomerId("cust-1");
    expect(remaining).toHaveLength(0);
  });

  it("should throw when subscription does not exist", async () => {
    await expect(useCase.execute("nonexistent", "cust-1")).rejects.toThrow(SubscriptionNotFoundError);
  });

  it("should throw when subscription belongs to another customer", async () => {
    const subs = await repository.findByCustomerId("cust-1");

    await expect(useCase.execute(subs[0].id, "cust-2")).rejects.toThrow(SubscriptionNotOwnedError);
  });
});
