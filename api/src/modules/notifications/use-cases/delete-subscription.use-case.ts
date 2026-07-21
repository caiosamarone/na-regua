import type { PushSubscriptionRepository } from "../gateways/push-subscription.repository";
import { SubscriptionNotFoundError, SubscriptionNotOwnedError } from "../errors/notification-errors";

export class DeleteSubscriptionUseCase {
  constructor(private subscriptionRepository: PushSubscriptionRepository) {}

  async execute(id: string, customerId: string) {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) throw new SubscriptionNotFoundError();
    if (subscription.customerId !== customerId) throw new SubscriptionNotOwnedError();

    await this.subscriptionRepository.delete(id);
  }
}
