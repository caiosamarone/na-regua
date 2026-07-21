import { z } from "zod";

export const galleryImageSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(),
  caption: z.string().nullable(),
  sortOrder: z.number().int().min(0),
  createdAt: z.date().transform((d) => d.toISOString()),
});

export const addGalleryImageInputSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(200).optional().nullable(),
});

export const reorderGalleryInputSchema = z.object({
  imageIds: z.array(z.string()),
});
