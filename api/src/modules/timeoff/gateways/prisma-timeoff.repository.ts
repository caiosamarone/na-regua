import { prisma } from "../../../config/prisma";
import type {
  TimeOffRepository,
  CreateTimeOffData,
  AffectedAppointment,
} from "./timeoff.repository";

export class PrismaTimeOffRepository implements TimeOffRepository {
  async findById(id: string) {
    return prisma.timeOff.findUnique({ where: { id } });
  }

  async findByStaffMember(staffMemberId: string) {
    return prisma.timeOff.findMany({
      where: { staffMemberId },
      orderBy: { startDate: "asc" },
    });
  }

  async findByBarbershop(barbershopId: string) {
    return prisma.timeOff.findMany({
      where: { barbershopId },
      orderBy: { startDate: "asc" },
    });
  }

  async findInRange(staffMemberId: string, startDate: Date, endDate: Date) {
    return prisma.timeOff.findMany({
      where: {
        staffMemberId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
  }

  async create(data: CreateTimeOffData) {
    return prisma.timeOff.create({ data });
  }

  async delete(id: string) {
    await prisma.timeOff.delete({ where: { id } });
  }

  async findAppointmentsInRange(
    staffMemberId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: staffMemberId,
        status: "BOOKED",
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: { select: { name: true } },
      },
    });

    return appointments.map((apt) => ({
      id: apt.id,
      customerId: apt.customerId,
      customerName: apt.customer?.name ?? "Desconhecido",
      customerEmail: apt.customer?.email ?? null,
      startTime: apt.startTime.toISOString(),
      serviceName: apt.service?.name ?? "Desconhecido",
    }));
  }

  async cancelAppointmentsInRange(
    staffMemberId: string,
    startDate: Date,
    endDate: Date,
    cancelledById: string,
    cancelledByRole: string,
    reason: string | null,
  ) {
    const result = await prisma.appointment.updateMany({
      where: {
        barberId: staffMemberId,
        status: "BOOKED",
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      data: {
        status: "CANCELLED",
        cancelledById,
        cancelledByRole: cancelledByRole as any,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });

    return result.count;
  }
}
