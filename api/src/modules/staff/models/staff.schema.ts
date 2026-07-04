import { z } from "zod";

export const staffMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "BARBERSHOP_ADMIN", "BARBER"]),
  isBookable: z.boolean(),
  isActive: z.boolean(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listStaffQuerySchema = z.object({
  all: z.coerce.boolean().optional().default(false),
});

export const inviteStaffInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["BARBERSHOP_ADMIN", "BARBER"]),
});

export const updateStaffInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["BARBERSHOP_ADMIN", "BARBER"]).optional(),
});

export const toggleBookableInputSchema = z.object({
  isBookable: z.boolean(),
});

export const listStaffResponseSchema = z.object({
  data: z.array(staffMemberSchema),
});
