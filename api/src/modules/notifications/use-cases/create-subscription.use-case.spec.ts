import { InMemoryPushSubscriptionRepository } from "../../../tests/helpers/in-memory-push-subscription.repository";
import { CreateSubscriptionUseCase } from "./create-subscription.use-case";

describe("CreateSubscriptionUseCase", () => {
  let repository: InMemoryPushSubscriptionRepository;
  let useCase: CreateSubscriptionUseCase;

  beforeEach(() => {
    repository = new InMemoryPushSubscriptionRepository();
    useCase = new CreateSubscriptionUseCase(repository);
  });

  afterEach(() => {
    repository.reset();
  });

  it("should create a new subscription", async () => {
    const result = await useCase.execute({
      customerId: "cust-1",
      endpoint: "https://example.com/push",
      keys: { p256dh: "key1", auth: "auth1" },
      deviceInfo: "Chrome on macOS",
    });

    expect(result.alreadyExisted).toBe(false);
    expect(result.subscription.endpoint).toBe("https://example.com/push");
    expect(result.subscription.customerId).toBe("cust-1");
    expect(result.subscription.deviceInfo).toBe("Chrome on macOS");
    expect(result.subscription.id).toBeDefined();
  });

  it("should return existing subscription when same endpoint is already registered", async () => {
    const first = await useCase.execute({
      customerId: "cust-1",
      endpoint: "https://example.com/push",
      keys: { p256dh: "key1", auth: "auth1" },
    });

    const second = await useCase.execute({
      customerId: "cust-1",
      endpoint: "https://example.com/push",
      keys: { p256dh: "key1", auth: "auth1" },
    });

    expect(second.alreadyExisted).toBe(true);
    expect(second.subscription.id).toBe(first.subscription.id);
  });

  it("should allow the same endpoint for different customers", async () => {
    await useCase.execute({
      customerId: "cust-1",
      endpoint: "https://example.com/push",
      keys: { p256dh: "key1", auth: "auth1" },
    });

    const result = await useCase.execute({
      customerId: "cust-2",
      endpoint: "https://example.com/push",
      keys: { p256dh: "key1", auth: "auth1" },
    });

    expect(result.alreadyExisted).toBe(false);
    expect(result.subscription.customerId).toBe("cust-2");
  });

  it("should create multiple subscriptions for the same customer (different endpoints)", async () => {
    const first = await useCase.execute({
      customerId: "cust-1",
      endpoint: "https://example.com/push1",
      keys: { p256dh: "key1", auth: "auth1" },
    });

    const second = await useCase.execute({
      customerId: "cust-1",
      endpoint: "https://example.com/push2",
      keys: { p256dh: "key2", auth: "auth2" },
    });

    expect(first.alreadyExisted).toBe(false);
    expect(second.alreadyExisted).toBe(false);
    expect(first.subscription.id).not.toBe(second.subscription.id);
  });
});
