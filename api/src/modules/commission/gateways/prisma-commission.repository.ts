import { prisma } from "../../../config/prisma";
import type {
  CommissionRepository,
  CreateCommissionEntryInput,
  BarberCommissionSummary,
} from "./commission.repository";
import type { CommissionEntry, CommissionPayment, CommissionStatus, StaffRole } from "../../../generated/prisma/client";

export class PrismaCommissionRepository implements CommissionRepository {
  async findByAppointmentId(appointmentId: string) {
    return prisma.commissionEntry.findUnique({
      where: { appointmentId },
    }) as any;
  }

  async createEntry(data: CreateCommissionEntryInput) {
    return prisma.commissionEntry.create({ data }) as any;
  }

  async findBarbershopSummary(
    barbershopId: string,
    from?: Date,
    to?: Date,
    barberId?: string,
    status?: CommissionStatus,
    page = 1,
    pageSize = 20,
  ) {
    const whereStaff = {
      barbershopId,
      role: { in: ["BARBER", "BARBERSHOP_ADMIN"] as StaffRole[] },
      isActive: true,
      ...(barberId ? { id: barberId } : {}),
    };

    const total = await prisma.staffMember.count({ where: whereStaff });

    const staff = await prisma.staffMember.findMany({
      where: whereStaff,
      select: {
        id: true,
        name: true,
        commissionPercent: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const barbers: BarberCommissionSummary[] = [];
    for (const s of staff) {
      const entries = await prisma.commissionEntry.findMany({
        where: { staffMemberId: s.id, barbershopId, ...(status ? { status } : {}) },
      });

      const pendingAmount = entries
        .filter((e) => e.status === "PENDING")
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const paidThisMonth = entries
        .filter((e) => e.status === "PAID" && e.paidAt && e.paidAt >= firstOfMonth)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      barbers.push({
        staffMemberId: s.id,
        name: s.name,
        commissionPercent: s.commissionPercent ? Number(s.commissionPercent) : null,
        pendingAmount,
        paidThisMonth,
        pendingEntries: entries.filter((e) => e.status === "PENDING").length,
        paidEntriesThisMonth: entries.filter(
          (e) => e.status === "PAID" && e.paidAt && e.paidAt >= firstOfMonth,
        ).length,
      });
    }

    return { barbers, total };
  }

  async findBarberEntries(
    staffMemberId: string,
    barbershopId: string,
    from?: Date,
    to?: Date,
    status?: CommissionStatus,
  ) {
    const where: any = { staffMemberId, barbershopId };
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    return prisma.commissionEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        appointment: {
          select: {
            startTime: true,
            priceAtBooking: true,
            service: { select: { name: true } },
            customer: { select: { name: true } },
          },
        },
      },
    }) as any;
  }

  async findPendingByBarber(barbershopId: string, staffMemberId?: string) {
    const where: any = { barbershopId, status: "PENDING" };
    if (staffMemberId) where.staffMemberId = staffMemberId;
    return prisma.commissionEntry.findMany({ where }) as any;
  }

  async payEntries(
    entryIds: string[],
    barbershopId: string,
    staffMemberId?: string,
    notes?: string,
  ) {
    const amount = await prisma.commissionEntry.aggregate({
      _sum: { amount: true },
      where: { id: { in: entryIds } },
    });

    return prisma.$transaction(async (tx) => {
      const payment = await tx.commissionPayment.create({
        data: {
          barbershopId,
          staffMemberId: staffMemberId ?? null,
          amount: amount._sum.amount ?? 0,
          notes: notes ?? null,
        },
      });

      await tx.commissionEntry.updateMany({
        where: { id: { in: entryIds } },
        data: { status: "PAID", paidAt: new Date(), paymentId: payment.id },
      });

      return payment as any;
    });
  }

  async getBarberTotals(staffMemberId: string, barbershopId: string) {
    const staff = await prisma.staffMember.findUnique({
      where: { id: staffMemberId },
      select: { commissionPercent: true },
    });

    const entries = await prisma.commissionEntry.findMany({
      where: { staffMemberId, barbershopId },
    });

    const totalGenerated = entries.reduce((sum, e) => sum + Number(e.amount), 0);
    const pendingAmount = entries
      .filter((e) => e.status === "PENDING")
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const paidAmount = entries
      .filter((e) => e.status === "PAID")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      totalGenerated,
      pendingAmount,
      paidAmount,
      commissionPercent: staff?.commissionPercent ? Number(staff.commissionPercent) : null,
    };
  }
}
