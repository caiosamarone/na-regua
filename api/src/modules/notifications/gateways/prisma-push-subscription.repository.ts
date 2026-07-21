import { prisma } from "../../../config/prisma";
import type { PushSubscriptionRepository, PushSubscriptionData } from "./push-subscription.repository";

export class PrismaPushSubscriptionRepository implements PushSubscriptionRepository {
  async findByCustomerId(customerId: string): Promise<PushSubscriptionData[]> {
    const subs = await prisma.pushSubscription.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
    return subs as unknown as PushSubscriptionData[];
  }

  async findById(id: string): Promise<PushSubscriptionData | null> {
    const sub = await prisma.pushSubscription.findUnique({ where: { id } });
    return sub as unknown as PushSubscriptionData | null;
  }

  async create(data: {
    customerId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    deviceInfo?: string | null;
  }): Promise<PushSubscriptionData> {
    const sub = await prisma.pushSubscription.create({ data });
    return sub as unknown as PushSubscriptionData;
  }

  async delete(id: string): Promise<void> {
    await prisma.pushSubscription.delete({ where: { id } });
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await prisma.pushSubscription.delete({ where: { endpoint } });
  }
}
