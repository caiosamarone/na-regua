import { prisma } from "../../../config/prisma";
import type {
  AppointmentRepository,
  AppointmentWithRelations,
  StaffProfile,
  ServiceProfile,
} from "./appointment.repository";
import type { Appointment } from "../../../generated/prisma/client";

export class PrismaAppointmentRepository implements AppointmentRepository {
  async findById(id: string) {
    return prisma.appointment.findUnique({ where: { id } }) as any;
  }

  async findByIdWithRelations(id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        barber: { select: { id: true, name: true } },
        service: { select: { name: true } },
      },
    });
    if (!appointment) return null;
    return {
      ...appointment,
      priceAtBooking: Number(appointment.priceAtBooking),
    } as unknown as AppointmentWithRelations;
  }

  async findByCustomerId(
    customerId: string,
    options: { status?: string; from?: Date; to?: Date; page: number; pageSize: number },
  ) {
    const where: any = { customerId };
    if (options.status) where.status = options.status;
    if (options.from || options.to) {
      where.startTime = {};
      if (options.from) where.startTime.gte = options.from;
      if (options.to) where.startTime.lte = options.to;
    }

    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          barber: { select: { id: true, name: true } },
          service: { select: { name: true } },
        },
        orderBy: { startTime: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      data: data.map((a) => ({ ...a, priceAtBooking: Number(a.priceAtBooking) })) as unknown as AppointmentWithRelations[],
      total,
    };
  }

  async findByBarbershopId(
    barbershopId: string,
    options: { status?: string; from?: Date; to?: Date; barberId?: string; page: number; pageSize: number },
  ) {
    const where: any = { barbershopId };
    if (options.status) where.status = options.status;
    if (options.barberId) where.barberId = options.barberId;
    if (options.from || options.to) {
      where.startTime = {};
      if (options.from) where.startTime.gte = options.from;
      if (options.to) where.startTime.lte = options.to;
    }

    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          barber: { select: { id: true, name: true } },
          service: { select: { name: true } },
        },
        orderBy: { startTime: "desc" },
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      data: data.map((a) => ({ ...a, priceAtBooking: Number(a.priceAtBooking) })) as unknown as AppointmentWithRelations[],
      total,
    };
  }

  async findBookedInRange(barberId: string, startDate: Date, endDate: Date) {
    return prisma.appointment.findMany({
      where: {
        barberId,
        status: "BOOKED",
        startTime: { lt: endDate },
        endTime: { gt: startDate },
      },
    }) as any;
  }

  async create(data: {
    barbershopId: string;
    customerId: string;
    barberId: string;
    serviceId: string;
    serviceName: string;
    priceAtBooking: number;
    durationAtBooking: number;
    startTime: Date;
    endTime: Date;
  }) {
    return prisma.appointment.create({ data: { ...data, priceAtBooking: data.priceAtBooking } }) as any;
  }

  async updateStatus(
    id: string,
    status: "CANCELLED" | "DONE",
    cancelData?: {
      cancelledById: string;
      cancelledByRole: "CUSTOMER" | "BARBER" | "BARBERSHOP_ADMIN";
      cancellationReason?: string | null;
      cancelledAt: Date;
    },
  ) {
    const data: any = { status };
    if (cancelData) {
      data.cancelledById = cancelData.cancelledById;
      data.cancelledByRole = cancelData.cancelledByRole;
      data.cancellationReason = cancelData.cancellationReason ?? null;
      data.cancelledAt = cancelData.cancelledAt;
    }
    return prisma.appointment.update({ where: { id }, data }) as any;
  }

  async findBarbershopById(id: string) {
    return prisma.barbershop.findUnique({ where: { id } }) as any;
  }

  async findServiceById(id: string) {
    return prisma.service.findUnique({
      where: { id },
      select: { id: true, name: true, durationMinutes: true, price: true, isActive: true },
    }) as any;
  }

  async findStaffById(id: string) {
    return prisma.staffMember.findUnique({
      where: { id },
      select: { id: true, name: true, barbershopId: true },
    }) as any;
  }

  async findOperatingHours(barbershopId: string, dayOfWeek: number) {
    return prisma.operatingHour.findMany({
      where: { barbershopId, dayOfWeek },
      orderBy: { startTime: "asc" },
    }) as any;
  }

  async findBlockedDates(barbershopId: string, date: Date) {
    return prisma.blockedDate.findMany({
      where: {
        barbershopId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    }) as any;
  }
}
