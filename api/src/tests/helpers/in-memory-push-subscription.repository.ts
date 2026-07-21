import type { PushSubscriptionRepository, PushSubscriptionData } from "../../modules/notifications/gateways/push-subscription.repository";

export class InMemoryPushSubscriptionRepository implements PushSubscriptionRepository {
  subscriptions: PushSubscriptionData[] = [];

  reset() {
    this.subscriptions = [];
  }

  async findByCustomerId(customerId: string) {
    return this.subscriptions.filter((s) => s.customerId === customerId);
  }

  async findById(id: string) {
    return this.subscriptions.find((s) => s.id === id) ?? null;
  }

  async create(data: {
    customerId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    deviceInfo?: string | null;
  }) {
    const sub: PushSubscriptionData = {
      id: `sub-${this.subscriptions.length + 1}`,
      customerId: data.customerId,
      endpoint: data.endpoint,
      keys: data.keys,
      deviceInfo: data.deviceInfo ?? null,
      createdAt: new Date(),
    };
    this.subscriptions.push(sub);
    return sub;
  }

  async delete(id: string) {
    const index = this.subscriptions.findIndex((s) => s.id === id);
    if (index >= 0) this.subscriptions.splice(index, 1);
  }

  async deleteByEndpoint(endpoint: string) {
    const index = this.subscriptions.findIndex((s) => s.endpoint === endpoint);
    if (index >= 0) this.subscriptions.splice(index, 1);
  }
}
