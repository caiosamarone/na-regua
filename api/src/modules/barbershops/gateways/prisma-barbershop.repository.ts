import { prisma } from "../../../config/prisma";
import type {
  BarbershopRepository,
  BarbershopNearbyItem,
} from "./barbershop.repository";

export class PrismaBarbershopRepository implements BarbershopRepository {
  async findById(id: string) {
    return prisma.barbershop.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return prisma.barbershop.findUnique({ where: { slug } });
  }

  async findNearby(lat: number, lng: number, radiusKm: number) {
    const radiusMeters = radiusKm * 1000;

    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT
        id, name, slug, address, neighborhood, city, state, phone, "logoUrl",
        latitude, longitude,
        earth_distance(ll_to_earth($1, $2), ll_to_earth(latitude, longitude)) AS distance
      FROM "Barbershop"
      WHERE earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth(latitude, longitude)
        AND earth_distance(ll_to_earth($1, $2), ll_to_earth(latitude, longitude)) <= $3
        AND active = true
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
      ORDER BY distance ASC`,
      lat,
      lng,
      radiusMeters,
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

  async search(query: string) {
    const rows = await prisma.barbershop.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { neighborhood: { contains: query, mode: "insensitive" } },
        ],
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

  async findServices(barbershopId: string) {
    return prisma.service.findMany({
      where: { barbershopId, isActive: true },
    });
  }
}
