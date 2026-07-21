import { z } from "zod";

export const createTimeOffSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  confirm: z.boolean().optional().default(false),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: "endDate deve ser maior ou igual a startDate", path: ["endDate"] },
).refine(
  (data) => {
    if ((data.startTime && !data.endTime) || (!data.startTime && data.endTime)) return false;
    return true;
  },
  { message: "startTime e endTime devem ser informados juntos", path: ["startTime"] },
).refine(
  (data) => {
    if (data.startTime && data.endTime) return data.endTime > data.startTime;
    return true;
  },
  { message: "endTime deve ser maior que startTime", path: ["endTime"] },
);

export const timeOffResponseSchema = z.object({
  id: z.string(),
  barbershopId: z.string(),
  staffMemberId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateTimeOffInput = z.infer<typeof createTimeOffSchema>;
