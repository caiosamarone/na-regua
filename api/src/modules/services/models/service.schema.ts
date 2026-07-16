import { z } from "zod";

export const serviceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number(),
  price: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listServicesQuerySchema = z.object({
  all: z.coerce.boolean().optional().default(false),
});

export const createServiceInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480),
  price: z.number().min(0).max(99999.99),
});

export const updateServiceInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  price: z.number().min(0).max(99999.99).optional(),
});

export const listServicesResponseSchema = z.object({
  data: z.array(serviceItemSchema),
});
