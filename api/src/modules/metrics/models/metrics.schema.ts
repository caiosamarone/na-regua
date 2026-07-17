import { z } from "zod";

export const metricsQuerySchema = z.object({
  from: z.string().date("Formato deve ser YYYY-MM-DD"),
  to: z.string().date("Formato deve ser YYYY-MM-DD"),
});

export const adminMetricsResponseSchema = z.object({
  activeBarbershops: z.number(),
  totalRevenue: z.number(),
  totalDone: z.number(),
  totalCancelled: z.number(),
  topBarbershops: z.array(
    z.object({
      barbershopId: z.string(),
      barbershopName: z.string(),
      appointmentCount: z.number(),
      revenue: z.number(),
    }),
  ),
});

export const barbershopMetricsResponseSchema = z.object({
  totalRevenue: z.number(),
  topServices: z.array(
    z.object({
      serviceName: z.string(),
      bookingCount: z.number(),
      revenue: z.number(),
    }),
  ),
  topBarbers: z.array(
    z.object({
      barberId: z.string(),
      appointmentCount: z.number(),
      revenue: z.number(),
    }),
  ),
  busiestDays: z.array(
    z.object({
      date: z.string(),
      appointmentCount: z.number(),
    }),
  ),
});

export const barberMetricsResponseSchema = z.object({
  totalDone: z.number(),
  revenue: z.number(),
  topServices: z.array(
    z.object({
      serviceName: z.string(),
      bookingCount: z.number(),
      revenue: z.number(),
    }),
  ),
  avgPerDay: z.number(),
});
