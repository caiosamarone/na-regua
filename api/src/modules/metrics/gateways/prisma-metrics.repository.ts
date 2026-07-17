import { prisma } from "../../../config/prisma";
import type {
  MetricsRepository,
  TopBarbershopRow,
  TopServiceRow,
  TopBarberRow,
  BusiestDayRow,
  BarberAvgPerDay,
} from "./metrics.repository";

export class PrismaMetricsRepository implements MetricsRepository {
  async getActiveBarbershopsCount(): Promise<number> {
    return prisma.barbershop.count({ where: { active: true } });
  }

  async getGlobalTotalRevenue(from: Date, to: Date): Promise<number> {
    const result = await prisma.appointment.aggregate({
      _sum: { priceAtBooking: true },
      where: { status: "DONE", startTime: { gte: from, lt: to } },
    });
    return Number(result._sum.priceAtBooking ?? 0);
  }

  async getGlobalTotalDone(from: Date, to: Date): Promise<number> {
    return prisma.appointment.count({
      where: { status: "DONE", startTime: { gte: from, lt: to } },
    });
  }

  async getGlobalTotalCancelled(from: Date, to: Date): Promise<number> {
    return prisma.appointment.count({
      where: { status: "CANCELLED", startTime: { gte: from, lt: to } },
    });
  }

  async getTopBarbershops(from: Date, to: Date): Promise<TopBarbershopRow[]> {
    const rows = await prisma.$queryRaw<TopBarbershopRow[]>`
      SELECT
        b.id::text AS "barbershopId",
        b.name::text AS "barbershopName",
        COUNT(a.id)::int AS "appointmentCount",
        COALESCE(SUM(a."priceAtBooking")::decimal, 0)::numeric AS "revenue"
      FROM "Barbershop" b
      LEFT JOIN "Appointment" a ON a."barbershopId" = b.id
        AND a.status = 'DONE'
        AND a."startTime" >= ${from}
        AND a."startTime" < ${to}
      WHERE b.active = true
      GROUP BY b.id, b.name
      ORDER BY "revenue" DESC
      LIMIT 10
    `;
    return rows.map((r) => ({
      ...r,
      revenue: Number(r.revenue),
    }));
  }

  async getBarbershopRevenue(barbershopId: string, from: Date, to: Date): Promise<number> {
    const result = await prisma.appointment.aggregate({
      _sum: { priceAtBooking: true },
      where: { barbershopId, status: "DONE", startTime: { gte: from, lt: to } },
    });
    return Number(result._sum.priceAtBooking ?? 0);
  }

  async getTopServices(barbershopId: string, from: Date, to: Date): Promise<TopServiceRow[]> {
    const rows = await prisma.$queryRaw<TopServiceRow[]>`
      SELECT
        "serviceName"::text AS "serviceName",
        COUNT(*)::int AS "bookingCount",
        COALESCE(SUM("priceAtBooking")::decimal, 0)::numeric AS "revenue"
      FROM "Appointment"
      WHERE "barbershopId" = ${barbershopId}
        AND status = 'DONE'
        AND "startTime" >= ${from}
        AND "startTime" < ${to}
      GROUP BY "serviceName"
      ORDER BY "revenue" DESC
      LIMIT 10
    `;
    return rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
  }

  async getTopBarbers(barbershopId: string, from: Date, to: Date): Promise<TopBarberRow[]> {
    const rows = await prisma.$queryRaw<TopBarberRow[]>`
      SELECT
        "barberId"::text AS "barberId",
        COUNT(*)::int AS "appointmentCount",
        COALESCE(SUM("priceAtBooking")::decimal, 0)::numeric AS "revenue"
      FROM "Appointment"
      WHERE "barbershopId" = ${barbershopId}
        AND status = 'DONE'
        AND "startTime" >= ${from}
        AND "startTime" < ${to}
      GROUP BY "barberId"
      ORDER BY "revenue" DESC
      LIMIT 10
    `;
    return rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
  }

  async getBusiestDays(barbershopId: string, from: Date, to: Date): Promise<BusiestDayRow[]> {
    const rows = await prisma.$queryRaw<BusiestDayRow[]>`
      SELECT
        DATE("startTime")::text AS "date",
        COUNT(*)::int AS "appointmentCount"
      FROM "Appointment"
      WHERE "barbershopId" = ${barbershopId}
        AND status = 'DONE'
        AND "startTime" >= ${from}
        AND "startTime" < ${to}
      GROUP BY DATE("startTime")
      ORDER BY "appointmentCount" DESC
      LIMIT 10
    `;
    return rows.map((r) => ({ ...r, date: String(r.date) }));
  }

  async getBarberTotalDone(barberId: string, from: Date, to: Date): Promise<number> {
    return prisma.appointment.count({
      where: { barberId, status: "DONE", startTime: { gte: from, lt: to } },
    });
  }

  async getBarberRevenue(barberId: string, from: Date, to: Date): Promise<number> {
    const result = await prisma.appointment.aggregate({
      _sum: { priceAtBooking: true },
      where: { barberId, status: "DONE", startTime: { gte: from, lt: to } },
    });
    return Number(result._sum.priceAtBooking ?? 0);
  }

  async getBarberTopServices(barberId: string, from: Date, to: Date): Promise<TopServiceRow[]> {
    const rows = await prisma.$queryRaw<TopServiceRow[]>`
      SELECT
        "serviceName"::text AS "serviceName",
        COUNT(*)::int AS "bookingCount",
        COALESCE(SUM("priceAtBooking")::decimal, 0)::numeric AS "revenue"
      FROM "Appointment"
      WHERE "barberId" = ${barberId}
        AND status = 'DONE'
        AND "startTime" >= ${from}
        AND "startTime" < ${to}
      GROUP BY "serviceName"
      ORDER BY "bookingCount" DESC
      LIMIT 5
    `;
    return rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
  }

  async getBarberAvgPerDay(barberId: string, from: Date, to: Date): Promise<BarberAvgPerDay> {
    const rows = await prisma.$queryRaw<Array<{ totalAppointments: number; daysInPeriod: number; avgPerDay: number }>>`
      WITH days AS (
        SELECT GENERATE_SERIES(${from}::date, ${to}::date, '1 day'::interval)::date AS day
      )
      SELECT
        COALESCE(COUNT(a.id)::int, 0) AS "totalAppointments",
        COUNT(DISTINCT d.day)::int AS "daysInPeriod",
        ROUND(
          COALESCE(COUNT(a.id)::decimal / NULLIF(COUNT(DISTINCT d.day), 0), 0),
          1
        )::numeric AS "avgPerDay"
      FROM days d
      LEFT JOIN "Appointment" a ON a."barberId" = ${barberId}
        AND a.status = 'DONE'
        AND DATE(a."startTime") = d.day
        AND a."startTime" >= ${from}
        AND a."startTime" < ${to}
    `;
    const row = rows[0];
    return {
      totalAppointments: row?.totalAppointments ?? 0,
      daysInPeriod: row?.daysInPeriod ?? 0,
      avgPerDay: Number(row?.avgPerDay ?? 0),
    };
  }
}
