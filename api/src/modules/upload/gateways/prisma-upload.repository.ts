import { prisma } from "../../../config/prisma";
import type { UploadRepository } from "./upload.repository";

export class PrismaUploadRepository implements UploadRepository {
  async saveBarbershopLogo(barbershopId: string, url: string): Promise<void> {
    await prisma.barbershop.update({
      where: { id: barbershopId },
      data: { logoUrl: url },
    });
  }

  async saveStaffAvatar(barbershopId: string, staffId: string, url: string): Promise<void> {
    await prisma.staffMember.update({
      where: { id: staffId, barbershopId },
      data: { avatarUrl: url },
    });
  }

  async findStaffById(staffId: string) {
    return prisma.staffMember.findUnique({
      where: { id: staffId },
      select: { id: true, barbershopId: true },
    });
  }

  async findBarbershopById(barbershopId: string) {
    return prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true },
    });
  }
}
