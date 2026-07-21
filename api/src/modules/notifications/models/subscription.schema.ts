import { z } from "zod";

export const createSubscriptionInputSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  deviceInfo: z.string().optional(),
});

export const subscriptionResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  endpoint: z.string(),
  deviceInfo: z.string().nullable(),
  createdAt: z.string(),
});
