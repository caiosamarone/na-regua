import { prisma } from "../../../config/prisma";
import type {
  StaffRepository,
  CreateStaffInput,
  UpdateStaffInput,
} from "./staff.repository";

export class PrismaStaffRepository implements StaffRepository {
  async findByBarbershopId(barbershopId: string, includeInactive = false) {
    return prisma.staffMember.findMany({
      where: { barbershopId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: "asc" },
    }) as any;
  }

  async findById(id: string) {
    return prisma.staffMember.findUnique({ where: { id } }) as any;
  }

  async findByEmail(email: string) {
    return prisma.staffMember.findUnique({ where: { email } }) as any;
  }

  async create(data: CreateStaffInput) {
    return prisma.staffMember.create({ data }) as any;
  }

  async update(id: string, data: UpdateStaffInput) {
    return prisma.staffMember.update({ where: { id }, data }) as any;
  }

  async softDelete(id: string) {
    await prisma.staffMember.update({
      where: { id },
      data: { isActive: false, isBookable: false },
    });
  }

  async findFutureBookings(staffId: string) {
    return prisma.appointment.findMany({
      where: {
        barberId: staffId,
        status: "BOOKED",
        startTime: { gt: new Date() },
      },
      select: { id: true, startTime: true, customerId: true },
      orderBy: { startTime: "asc" },
    });
  }
}
