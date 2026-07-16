import { z } from "zod";

export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const searchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0).max(100).optional(),
}).refine(
  (data) => {
    const hasLat = data.lat != null;
    const hasLng = data.lng != null;
    const hasRadius = data.radiusKm != null;
    const count = [hasLat, hasLng, hasRadius].filter(Boolean).length;
    return count === 0 || count === 3;
  },
  { message: "lat, lng e radiusKm devem ser informados juntos" },
);

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
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
});

export const serviceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number(),
  price: z.number(),
});

export const bookableStaffItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  avatarUrl: z.string().nullable(),
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
  staff: z.array(bookableStaffItemSchema),
});

export const barbershopListResponseSchema = z.object({
  data: z.array(barbershopListItemSchema),
});

export const barbershopProfileResponseSchema = z.object({
  data: barbershopProfileSchema,
});

export const bookableStaffResponseSchema = z.object({
  data: z.array(bookableStaffItemSchema),
});

export const createBarbershopInputSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  address: z.string().min(1).max(200),
  cep: z.string().min(8).max(9),
  neighborhood: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  timezone: z.string().min(1),
  phone: z.string().optional().nullable(),
  adminEmail: z.string().email(),
});

export const updateBarbershopStatusSchema = z.object({
  active: z.boolean(),
});

export const updateBarbershopProfileInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(200).optional(),
  cep: z.string().min(8).max(9).optional(),
  neighborhood: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(2).max(2).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  timezone: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
});

export const replaceOperatingHoursInputSchema = z
  .array(operatingHourSchema)
  .min(1, "Pelo menos um horário deve ser enviado")
  .refine(
    (hours) => {
      const byDay: Record<number, Array<{ start: number; end: number }>> = {};
      for (const h of hours) {
        if (!byDay[h.dayOfWeek]) byDay[h.dayOfWeek] = [];
        const start = parseInt(h.startTime.replace(":", ""));
        const end = parseInt(h.endTime.replace(":", ""));
        byDay[h.dayOfWeek].push({ start, end });
      }
      for (const day of Object.keys(byDay)) {
        const intervals = byDay[parseInt(day)].sort((a, b) => a.start - b.start);
        for (let i = 1; i < intervals.length; i++) {
          if (intervals[i].start < intervals[i - 1].end) return false;
        }
      }
      return true;
    },
    { message: "Horários não podem se sobrepor no mesmo dia" },
  );

export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato deve ser YYYY-MM-DD");

export const blockedDateInputSchema = z.object({
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  reason: z.string().max(200).optional().nullable(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: "endDate não pode ser menor que startDate", path: ["endDate"] },
);

export const blockedDateQuerySchema = z.object({
  confirm: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export const blockedDatePreviewSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  startTime: z.string(),
  serviceName: z.string(),
});

export const blockedDatePreviewResponseSchema = z.object({
  data: z.object({
    preview: z.literal(true),
    affectedAppointments: z.array(blockedDatePreviewSchema),
  }),
});

export const blockedDateConfirmResponseSchema = z.object({
  data: z.object({
    blockedDate: z.object({
      id: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().nullable(),
    }),
    cancelledCount: z.number(),
  }),
});

export const updateBarbershopStatusParamsSchema = z.object({
  id: z.string(),
});
