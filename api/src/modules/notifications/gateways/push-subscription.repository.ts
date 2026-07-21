import type { PushSubscription } from "../../../generated/prisma/client";

export type PushSubscriptionData = {
  id: string;
  customerId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  deviceInfo: string | null;
  createdAt: Date;
};

export interface PushSubscriptionRepository {
  findByCustomerId(customerId: string): Promise<PushSubscriptionData[]>;
  findById(id: string): Promise<PushSubscriptionData | null>;
  create(data: {
    customerId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    deviceInfo?: string | null;
  }): Promise<PushSubscriptionData>;
  delete(id: string): Promise<void>;
  deleteByEndpoint(endpoint: string): Promise<void>;
}
