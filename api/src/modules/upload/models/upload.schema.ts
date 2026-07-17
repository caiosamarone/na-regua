import { z } from "zod";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const uploadResponseSchema = z.object({
  url: z.string().url(),
});

export const uploadLogoResponseSchema = z.object({
  data: uploadResponseSchema,
});

export const uploadAvatarResponseSchema = z.object({
  data: uploadResponseSchema,
});
