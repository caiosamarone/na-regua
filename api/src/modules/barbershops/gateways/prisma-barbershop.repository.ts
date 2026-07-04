import { prisma } from "../../../config/prisma";
import type {
  BarbershopRepository,
  BarbershopNearbyItem,
  OperatingHourInput,
  CreateBarbershopInput,
  UpdateBarbershopProfileInput,
} from "./barbershop.repository";
import type { InvitationRole } from "../../../generated/prisma/client";

export class PrismaBarbershopRepository implements BarbershopRepository {
  async findById(id: string) {
    return prisma.barbershop.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return prisma.barbershop.findUnique({ where: { slug } });
  }

  async search(query: string | undefined, lat?: number, lng?: number, radiusKm?: number) {
    const searchTerm = `%${query ?? ""}%`;

    if (lat != null && lng != null && radiusKm != null) {
      const radiusMeters = radiusKm * 1000;
      const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT
          id, name, slug, address, neighborhood, city, state, phone, "logoUrl",
          latitude, longitude,
          earth_distance(ll_to_earth($1, $2), ll_to_earth(latitude, longitude)) AS distance
        FROM "Barbershop"
        WHERE active = true
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth(latitude, longitude)
          AND (
            name ILIKE $4
            OR city ILIKE $4
            OR neighborhood ILIKE $4
          )
        ORDER BY distance ASC`,
        lat,
        lng,
        radiusMeters,
        searchTerm,
      );

      return rows.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        slug: r.slug as string,
        address: r.address as string,
        neighborhood: r.neighborhood as string,
        city: r.city as string,
        state: r.state as string,
        phone: (r.phone as string) ?? null,
        logoUrl: (r.logoUrl as string) ?? null,
        latitude: (r.latitude as number) ?? null,
        longitude: (r.longitude as number) ?? null,
        distanceKm: r.distance ? Number(r.distance) / 1000 : null,
      }));
    }

    const rows = await prisma.barbershop.findMany({
      where: {
        active: true,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { city: { contains: query, mode: "insensitive" } },
                { neighborhood: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        neighborhood: true,
        city: true,
        state: true,
        phone: true,
        logoUrl: true,
        latitude: true,
        longitude: true,
      },
      take: 50,
    });

    return rows.map((r) => ({ ...r, distanceKm: null }));
  }

  async findOperatingHours(barbershopId: string) {
    return prisma.operatingHour.findMany({
      where: { barbershopId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async findServices(barbershopId: string, includeInactive = false) {
    return prisma.service.findMany({
      where: { barbershopId, ...(includeInactive ? {} : { isActive: true }) },
    });
  }

  async findBookableStaff(barbershopId: string) {
    return prisma.staffMember.findMany({
      where: {
        barbershopId,
        isBookable: true,
        isActive: true,
        role: { in: ["BARBER", "BARBERSHOP_ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    }) as any;
  }

  async create(data: CreateBarbershopInput) {
    return prisma.barbershop.create({ data });
  }

  async updateStatus(barbershopId: string, active: boolean) {
    return prisma.barbershop.update({
      where: { id: barbershopId },
      data: { active },
    });
  }

  async updateProfile(barbershopId: string, data: UpdateBarbershopProfileInput) {
    return prisma.barbershop.update({
      where: { id: barbershopId },
      data,
    });
  }

  async replaceOperatingHours(barbershopId: string, hours: OperatingHourInput[]) {
    await prisma.$transaction(async (tx) => {
      await tx.operatingHour.deleteMany({ where: { barbershopId } });
      if (hours.length > 0) {
        await tx.operatingHour.createMany({
          data: hours.map((h) => ({ ...h, barbershopId })),
        });
      }
    });
  }

  async findBlockedDates(barbershopId: string) {
    return prisma.blockedDate.findMany({
      where: { barbershopId },
      orderBy: { startDate: "asc" },
    });
  }

  async findAppointmentsInRange(barbershopId: string, startDate: Date, endDate: Date) {
    return prisma.appointment.findMany({
      where: {
        barbershopId,
        status: "BOOKED",
        startTime: { lt: endDate },
        endTime: { gt: startDate },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: { select: { name: true } },
      },
    });
  }

  async createBlockedDate(barbershopId: string, startDate: Date, endDate: Date, reason: string | null) {
    return prisma.blockedDate.create({
      data: { barbershopId, startDate, endDate, reason },
    });
  }

  async cancelAppointmentsInRange(barbershopId: string, startDate: Date, endDate: Date, cancelledById: string, cancelledByRole: string, reason: string | null) {
    const result = await prisma.appointment.updateMany({
      where: {
        barbershopId,
        status: "BOOKED",
        startTime: { lt: endDate },
        endTime: { gt: startDate },
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

  async deleteBlockedDate(id: string) {
    await prisma.blockedDate.delete({ where: { id } });
  }

  async createInvitationToken(email: string, barbershopId: string, role: InvitationRole, tokenHash: string, expiresAt: Date) {
    await prisma.invitationToken.create({
      data: { email, barbershopId, role, tokenHash, expiresAt },
    });
  }
}
