import { z } from "zod";

export const slotQuerySchema = z.object({
  barberId: z.string().optional(),
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato deve ser YYYY-MM-DD"),
});

export const slotItemSchema = z.object({
  startTimeLocal: z.string(),
  startTimeUtc: z.string(),
  endTimeUtc: z.string(),
});

export const slotsResponseSchema = z.object({
  data: z.array(slotItemSchema),
});

export const createAppointmentInputSchema = z.object({
  barbershopId: z.string().min(1),
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  startTime: z.string().datetime(),
});

export const cancelAppointmentInputSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const appointmentResponseSchema = z.object({
  id: z.string(),
  barbershopId: z.string(),
  customerId: z.string(),
  barberId: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  priceAtBooking: z.number(),
  durationAtBooking: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(["BOOKED", "CANCELLED", "DONE"]),
  cancelledById: z.string().nullable(),
  cancelledByRole: z.enum(["CUSTOMER", "BARBER", "BARBERSHOP_ADMIN"]).nullable(),
  cancellationReason: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listAppointmentsQuerySchema = z.object({
  status: z.enum(["BOOKED", "CANCELLED", "DONE"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  barberId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
    }),
  });
