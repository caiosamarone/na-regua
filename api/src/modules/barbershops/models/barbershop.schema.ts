import { z } from "zod";

export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0).max(100).default(10),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
});

export const barbershopListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  address: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  phone: z.string().nullable(),
  logoUrl: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  distanceKm: z.number().nullable().optional(),
});

export const operatingHourSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
});

export const serviceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number(),
  price: z.number(),
});

export const barbershopProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  address: z.string(),
  cep: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  timezone: z.string(),
  phone: z.string().nullable(),
  logoUrl: z.string().nullable(),
  slotIntervalMinutes: z.number(),
  cancellationLeadTimeMinutes: z.number(),
  active: z.boolean(),
  operatingHours: z.array(operatingHourSchema),
  services: z.array(serviceItemSchema),
});

export const barbershopListResponseSchema = z.object({
  data: z.array(barbershopListItemSchema),
});

export const barbershopProfileResponseSchema = z.object({
  data: barbershopProfileSchema,
});
