import type { Barbershop, Appointment } from "../../generated/prisma/client";
import type {
  MetricsRepository,
  TopBarbershopRow,
  TopServiceRow,
  TopBarberRow,
  BusiestDayRow,
  BarberAvgPerDay,
} from "../../modules/metrics/gateways/metrics.repository";

export class InMemoryMetricsRepository implements MetricsRepository {
  barbershops: Barbershop[] = [];
  appointments: Appointment[] = [];

  reset() {
    this.barbershops = [];
    this.appointments = [];
  }

  async getActiveBarbershopsCount(): Promise<number> {
    return this.barbershops.filter((b) => b.active).length;
  }

  async getGlobalTotalRevenue(from: Date, to: Date): Promise<number> {
    return this.appointments
      .filter((a) => a.status === "DONE" && a.startTime >= from && a.startTime < to)
      .reduce((sum, a) => sum + Number(a.priceAtBooking), 0);
  }

  async getGlobalTotalDone(from: Date, to: Date): Promise<number> {
    return this.appointments.filter(
      (a) => a.status === "DONE" && a.startTime >= from && a.startTime < to,
    ).length;
  }

  async getGlobalTotalCancelled(from: Date, to: Date): Promise<number> {
    return this.appointments.filter(
      (a) => a.status === "CANCELLED" && a.startTime >= from && a.startTime < to,
    ).length;
  }

  async getTopBarbershops(from: Date, to: Date): Promise<TopBarbershopRow[]> {
    const shopMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const b of this.barbershops.filter((b) => b.active)) {
      shopMap.set(b.id, { name: b.name, count: 0, revenue: 0 });
    }
    for (const a of this.appointments) {
      if (a.status === "DONE" && a.startTime >= from && a.startTime < to) {
        const entry = shopMap.get(a.barbershopId);
        if (entry) {
          entry.count++;
          entry.revenue += Number(a.priceAtBooking);
        }
      }
    }
    return Array.from(shopMap.entries())
      .map(([barbershopId, v]) => ({
        barbershopId,
        barbershopName: v.name,
        appointmentCount: v.count,
        revenue: v.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  async getBarbershopRevenue(barbershopId: string, from: Date, to: Date): Promise<number> {
    return this.appointments
      .filter(
        (a) =>
          a.barbershopId === barbershopId &&
          a.status === "DONE" &&
          a.startTime >= from &&
          a.startTime < to,
      )
      .reduce((sum, a) => sum + Number(a.priceAtBooking), 0);
  }

  async getTopServices(barbershopId: string, from: Date, to: Date): Promise<TopServiceRow[]> {
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    for (const a of this.appointments) {
      if (
        a.barbershopId === barbershopId &&
        a.status === "DONE" &&
        a.startTime >= from &&
        a.startTime < to
      ) {
        const entry = serviceMap.get(a.serviceName) ?? { count: 0, revenue: 0 };
        entry.count++;
        entry.revenue += Number(a.priceAtBooking);
        serviceMap.set(a.serviceName, entry);
      }
    }
    return Array.from(serviceMap.entries())
      .map(([serviceName, v]) => ({ serviceName, bookingCount: v.count, revenue: v.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  async getTopBarbers(barbershopId: string, from: Date, to: Date): Promise<TopBarberRow[]> {
    const barberMap = new Map<string, { count: number; revenue: number }>();
    for (const a of this.appointments) {
      if (
        a.barbershopId === barbershopId &&
        a.status === "DONE" &&
        a.startTime >= from &&
        a.startTime < to
      ) {
        const entry = barberMap.get(a.barberId) ?? { count: 0, revenue: 0 };
        entry.count++;
        entry.revenue += Number(a.priceAtBooking);
        barberMap.set(a.barberId, entry);
      }
    }
    return Array.from(barberMap.entries())
      .map(([barberId, v]) => ({ barberId, appointmentCount: v.count, revenue: v.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  async getBusiestDays(barbershopId: string, from: Date, to: Date): Promise<BusiestDayRow[]> {
    const dayMap = new Map<string, number>();
    for (const a of this.appointments) {
      if (
        a.barbershopId === barbershopId &&
        a.status === "DONE" &&
        a.startTime >= from &&
        a.startTime < to
      ) {
        const dateStr = a.startTime.toISOString().split("T")[0];
        dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + 1);
      }
    }
    return Array.from(dayMap.entries())
      .map(([date, appointmentCount]) => ({ date, appointmentCount }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 10);
  }

  async getBarberTotalDone(barberId: string, from: Date, to: Date): Promise<number> {
    return this.appointments.filter(
      (a) => a.barberId === barberId && a.status === "DONE" && a.startTime >= from && a.startTime < to,
    ).length;
  }

  async getBarberRevenue(barberId: string, from: Date, to: Date): Promise<number> {
    return this.appointments
      .filter(
        (a) =>
          a.barberId === barberId &&
          a.status === "DONE" &&
          a.startTime >= from &&
          a.startTime < to,
      )
      .reduce((sum, a) => sum + Number(a.priceAtBooking), 0);
  }

  async getBarberTopServices(barberId: string, from: Date, to: Date): Promise<TopServiceRow[]> {
    const serviceMap = new Map<string, { count: number; revenue: number }>();
    for (const a of this.appointments) {
      if (
        a.barberId === barberId &&
        a.status === "DONE" &&
        a.startTime >= from &&
        a.startTime < to
      ) {
        const entry = serviceMap.get(a.serviceName) ?? { count: 0, revenue: 0 };
        entry.count++;
        entry.revenue += Number(a.priceAtBooking);
        serviceMap.set(a.serviceName, entry);
      }
    }
    return Array.from(serviceMap.entries())
      .map(([serviceName, v]) => ({ serviceName, bookingCount: v.count, revenue: v.revenue }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);
  }

  async getBarberAvgPerDay(barberId: string, from: Date, to: Date): Promise<BarberAvgPerDay> {
    const start = new Date(from);
    const end = new Date(to);
    let daysInPeriod = 0;
    let totalAppointments = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      daysInPeriod++;
      const dayStr = d.toISOString().split("T")[0];
      for (const a of this.appointments) {
        if (
          a.barberId === barberId &&
          a.status === "DONE" &&
          a.startTime.toISOString().startsWith(dayStr) &&
          a.startTime >= from &&
          a.startTime < to
        ) {
          totalAppointments++;
        }
      }
    }
    return {
      totalAppointments,
      daysInPeriod,
      avgPerDay: daysInPeriod > 0 ? Math.round((totalAppointments / daysInPeriod) * 10) / 10 : 0,
    };
  }
}
