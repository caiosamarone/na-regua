import { prisma } from "../../../config/prisma";
import type { ServiceRepository, CreateServiceInput, UpdateServiceInput } from "./service.repository";

export class PrismaServiceRepository implements ServiceRepository {
  async findByBarbershopId(barbershopId: string, includeInactive = false) {
    return prisma.service.findMany({
      where: { barbershopId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: "asc" },
    }) as any;
  }

  async findById(id: string) {
    return prisma.service.findUnique({ where: { id } }) as any;
  }

  async create(barbershopId: string, data: CreateServiceInput) {
    return prisma.service.create({
      data: {
        barbershopId,
        name: data.name,
        description: data.description ?? null,
        durationMinutes: data.durationMinutes,
        price: data.price,
      },
    }) as any;
  }

  async update(id: string, data: UpdateServiceInput) {
    return prisma.service.update({ where: { id }, data }) as any;
  }

  async softDelete(id: string) {
    await prisma.service.update({ where: { id }, data: { isActive: false } });
  }
}
