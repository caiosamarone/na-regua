import { z } from "zod";

export const commissionEntrySchema = z.object({
  id: z.string(),
  barbershopId: z.string(),
  staffMemberId: z.string(),
  appointmentId: z.string(),
  commissionPercent: z.number(),
  priceAtBooking: z.number(),
  amount: z.number(),
  status: z.enum(["PENDING", "PAID"]),
  paidAt: z.string().nullable(),
  createdAt: z.date().transform((d) => d.toISOString()),
  updatedAt: z.date().transform((d) => d.toISOString()),
});

export const barbershopCommissionQuerySchema = z.object({
  barberId: z.string().optional(),
  status: z.enum(["PENDING", "PAID"]).optional(),
  from: z.string().date("Formato deve ser YYYY-MM-DD").optional(),
  to: z.string().date("Formato deve ser YYYY-MM-DD").optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const barberCommissionQuerySchema = z.object({
  from: z.string().date("Formato deve ser YYYY-MM-DD").optional(),
  to: z.string().date("Formato deve ser YYYY-MM-DD").optional(),
  status: z.enum(["PENDING", "PAID"]).optional(),
});

export const payCommissionInputSchema = z.object({
  staffMemberId: z.string().optional(),
  payAll: z.boolean().optional(),
  note: z.string().max(255).optional(),
});

export const createCommissionEntrySchema = z.object({
  barbershopId: z.string(),
  staffMemberId: z.string(),
  appointmentId: z.string(),
  commissionPercent: z.number(),
  priceAtBooking: z.number(),
  amount: z.number(),
});

export const addGalleryImageInputSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const reorderGalleryInputSchema = z.object({
  imageIds: z.array(z.string()),
});
