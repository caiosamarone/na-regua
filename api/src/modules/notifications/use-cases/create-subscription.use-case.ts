import type { PushSubscriptionRepository, PushSubscriptionData } from "../gateways/push-subscription.repository";

export type CreateSubscriptionResult = {
  alreadyExisted: boolean;
  subscription: {
    id: string;
    customerId: string;
    endpoint: string;
    deviceInfo: string | null;
    createdAt: string;
  };
};

export class CreateSubscriptionUseCase {
  constructor(private subscriptionRepository: PushSubscriptionRepository) {}

  async execute(data: {
    customerId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    deviceInfo?: string | null;
  }): Promise<CreateSubscriptionResult> {
    const existing = await this.subscriptionRepository.findByCustomerId(data.customerId);
    const alreadyRegistered = existing.find((s) => s.endpoint === data.endpoint);
    if (alreadyRegistered) {
      return {
        alreadyExisted: true,
        subscription: this.toResponse(alreadyRegistered),
      };
    }

    const subscription = await this.subscriptionRepository.create({
      customerId: data.customerId,
      endpoint: data.endpoint,
      keys: data.keys,
      deviceInfo: data.deviceInfo ?? null,
    });

    return {
      alreadyExisted: false,
      subscription: this.toResponse(subscription),
    };
  }

  private toResponse(subscription: PushSubscriptionData) {
    return {
      id: subscription.id,
      customerId: subscription.customerId,
      endpoint: subscription.endpoint,
      deviceInfo: subscription.deviceInfo,
      createdAt: subscription.createdAt.toISOString(),
    };
  }
}
