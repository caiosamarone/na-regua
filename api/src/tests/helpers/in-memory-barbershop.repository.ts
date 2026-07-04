import type {
  Barbershop,
  OperatingHour,
  Service,
} from "../../generated/prisma/client";
import type {
  BarbershopRepository,
  BarbershopNearbyItem,
} from "../../modules/barbershops/gateways/barbershop.repository";

type StoredBarbershop = Omit<Barbershop, "staffMembers" | "services" | "operatingHours" | "blockedDates" | "appointments" | "invitationTokens">;
type StoredOperatingHour = Omit<OperatingHour, "barbershop">;
type StoredService = Omit<Service, "barbershop" | "appointments">;

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class InMemoryBarbershopRepository implements BarbershopRepository {
  barbershops: StoredBarbershop[] = [];
  operatingHours: StoredOperatingHour[] = [];
  services: StoredService[] = [];

  reset() {
    this.barbershops = [];
    this.operatingHours = [];
    this.services = [];
  }

  private toBarbershop(b: StoredBarbershop): Barbershop {
    return {
      ...b,
      staffMembers: [],
      services: [],
      operatingHours: [],
      blockedDates: [],
      appointments: [],
      invitationTokens: [],
    } as unknown as Barbershop;
  }

  async findById(id: string) {
    const b = this.barbershops.find((s) => s.id === id);
    return b ? this.toBarbershop(b) : null;
  }

  async findBySlug(slug: string) {
    const b = this.barbershops.find((s) => s.slug === slug);
    return b ? this.toBarbershop(b) : null;
  }

  async findNearby(lat: number, lng: number, radiusKm: number) {
    return this.barbershops
      .filter((b) => b.active && b.latitude != null && b.longitude != null)
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        address: b.address,
        neighborhood: b.neighborhood,
        city: b.city,
        state: b.state,
        phone: b.phone,
        logoUrl: b.logoUrl,
        latitude: b.latitude,
        longitude: b.longitude,
        distanceKm: haversineKm(lat, lng, b.latitude!, b.longitude!),
      }))
      .filter((b) => b.distanceKm !== null && b.distanceKm <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  async search(query: string) {
    const q = query.toLowerCase();
    return this.barbershops
      .filter(
        (b) =>
          b.active &&
          (b.name.toLowerCase().includes(q) ||
            b.city.toLowerCase().includes(q) ||
            b.neighborhood.toLowerCase().includes(q)),
      )
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        address: b.address,
        neighborhood: b.neighborhood,
        city: b.city,
        state: b.state,
        phone: b.phone,
        logoUrl: b.logoUrl,
        latitude: b.latitude,
        longitude: b.longitude,
        distanceKm: null,
      }));
  }

  async findOperatingHours(barbershopId: string) {
    return this.operatingHours
      .filter((oh) => oh.barbershopId === barbershopId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek) as OperatingHour[];
  }

  async findServices(barbershopId: string) {
    return this.services
      .filter((s) => s.barbershopId === barbershopId && s.isActive) as Service[];
  }
}
