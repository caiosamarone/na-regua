import { z } from "zod";
import { StaffRole } from "../../../generated/prisma/client";

export const idSchema = z.string().cuid();
export const emailSchema = z.string().email();

export const staffPayloadSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: emailSchema,
  role: z.nativeEnum(StaffRole),
  barbershopId: z.string().nullable().optional(),
});

export const staffLoginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
});

export const loginPayloadSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const staffLoginResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    staff: staffPayloadSchema,
  }),
});

export const googleAuthInputSchema = z.object({ idToken: z.string() });
export const customerPayloadSchema = z.object({
  id: idSchema,
  name: z.string(),
  email: emailSchema,
});

export const magicLinkRequestSchema = z.object({
  email: emailSchema,
});

export const magicLinkVerifySchema = z.object({
  token: z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const logoutSchema = refreshTokenSchema.extend({
  allDevices: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6),
  newPassword: z.string().min(8).regex(/[A-Z]/, "At least one uppercase").regex(/[^A-Za-z0-9]/, "At least one symbol"),
});

export const acceptInviteSchema = z.object({
  token: z.string(),
  name: z.string(),
  password: z.string().min(8).regex(/[A-Z]/, "At least one uppercase").regex(/[^A-Za-z0-9]/, "At least one symbol"),
});

export const magicLinkResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    customer: customerPayloadSchema,
  }),
});

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
});
