import type {
  Appointment,
  Barbershop,
  BlockedDate,
  InvitationRole,
  OperatingHour,
  Service,
  StaffMember,
} from "../../generated/prisma/client";
import type {
  BarbershopRepository,
  BarbershopNearbyItem,
  CreateBarbershopInput,
  OperatingHourInput,
  UpdateBarbershopProfileInput,
} from "../../modules/barbershops/gateways/barbershop.repository";

type StoredBarbershop = Omit<Barbershop, "staffMembers" | "services" | "operatingHours" | "blockedDates" | "appointments" | "invitationTokens">;
type StoredOperatingHour = Omit<OperatingHour, "barbershop">;
type StoredService = Omit<Service, "barbershop" | "appointments">;
type StoredStaff = Pick<StaffMember, "id" | "barbershopId" | "name" | "role" | "isBookable" | "isActive" | "avatarUrl">;
type StoredBlockedDate = Omit<BlockedDate, "barbershop">;
type StoredAppointment = Pick<Appointment, "id" | "barbershopId" | "customerId" | "barberId" | "serviceId" | "startTime" | "endTime" | "status" | "cancelledById" | "cancelledByRole" | "cancellationReason" | "cancelledAt"> & { customer?: { id: string; name: string; email: string } | null; service?: { name: string } | null };

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
  staffMembers: StoredStaff[] = [];
  blockedDates: StoredBlockedDate[] = [];
  appointments: StoredAppointment[] = [];
  invitationTokens: Array<{
    tokenHash: string;
    email: string;
    barbershopId: string;
    role: InvitationRole;
    expiresAt: Date;
    consumedAt: Date | null;
    createdAt: Date;
  }> = [];

  reset() {
    this.barbershops = [];
    this.operatingHours = [];
    this.services = [];
    this.staffMembers = [];
    this.blockedDates = [];
    this.appointments = [];
    this.invitationTokens = [];
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

  async search(query: string | undefined, lat?: number, lng?: number, radiusKm?: number) {
    const q = query?.toLowerCase() ?? "";
    const results = this.barbershops.filter(
      (b) =>
        b.active &&
        (!q ||
          b.name.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.neighborhood.toLowerCase().includes(q)),
    );

    if (lat != null && lng != null && radiusKm != null) {
      return results
        .filter((b) => b.latitude != null && b.longitude != null)
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
        .filter((b) => b.distanceKm <= radiusKm)
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return results.map((b) => ({
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

  async findServices(barbershopId: string, includeInactive = false) {
    return this.services
      .filter((s) => s.barbershopId === barbershopId && (includeInactive || s.isActive)) as Service[];
  }

  async findBookableStaff(barbershopId: string) {
    return this.staffMembers
      .filter(
        (s) =>
          s.barbershopId === barbershopId &&
          s.isBookable &&
          s.isActive &&
          (s.role === "BARBER" || s.role === "BARBERSHOP_ADMIN"),
      ) as StaffMember[];
  }

  async create(data: CreateBarbershopInput) {
    const now = new Date();
    const b = {
      id: `shop-${this.barbershops.length + 1}`,
      ...data,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      phone: data.phone ?? null,
      logoUrl: null,
      slotIntervalMinutes: 30,
      cancellationLeadTimeMinutes: 180,
      active: false,
      createdAt: now,
      updatedAt: now,
    } as StoredBarbershop;
    this.barbershops.push(b);
    return this.toBarbershop(b);
  }

  async updateStatus(barbershopId: string, active: boolean) {
    const b = this.barbershops.find((s) => s.id === barbershopId);
    if (!b) throw new Error("Barbershop not found");
    b.active = active;
    b.updatedAt = new Date();
    return this.toBarbershop(b);
  }

  async updateProfile(barbershopId: string, data: UpdateBarbershopProfileInput) {
    const b = this.barbershops.find((s) => s.id === barbershopId);
    if (!b) throw new Error("Barbershop not found");
    Object.assign(b, data);
    b.updatedAt = new Date();
    return this.toBarbershop(b);
  }

  async replaceOperatingHours(barbershopId: string, hours: OperatingHourInput[]) {
    this.operatingHours = this.operatingHours.filter(
      (oh) => oh.barbershopId !== barbershopId,
    );
    for (const h of hours) {
      this.operatingHours.push({
        id: `oh-${this.operatingHours.length + 1}`,
        barbershopId,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
      });
    }
  }

  async findBlockedDates(barbershopId: string) {
    return this.blockedDates
      .filter((bd) => bd.barbershopId === barbershopId)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()) as BlockedDate[];
  }

  async findAppointmentsInRange(barbershopId: string, startDate: Date, endDate: Date) {
    return this.appointments
      .filter(
        (a) =>
          a.barbershopId === barbershopId &&
          a.status === "BOOKED" &&
          new Date(a.startTime) < endDate &&
          new Date(a.endTime) > startDate,
      )
      .map((a) => ({
        ...a,
        customer: a.customer ?? { id: "", name: "", email: "" },
        service: a.service ?? { name: "" },
      })) as any;
  }

  async createBlockedDate(barbershopId: string, startDate: Date, endDate: Date, reason: string | null) {
    const bd = {
      id: `bd-${this.blockedDates.length + 1}`,
      barbershopId,
      startDate,
      endDate,
      reason,
      createdAt: new Date(),
    } as StoredBlockedDate;
    this.blockedDates.push(bd);
    return bd as BlockedDate;
  }

  async cancelAppointmentsInRange(barbershopId: string, startDate: Date, endDate: Date, cancelledById: string, cancelledByRole: string, reason: string | null) {
    let count = 0;
    for (const a of this.appointments) {
      if (
        a.barbershopId === barbershopId &&
        a.status === "BOOKED" &&
        new Date(a.startTime) < endDate &&
        new Date(a.endTime) > startDate
      ) {
        a.status = "CANCELLED" as any;
        a.cancelledById = cancelledById;
        a.cancelledByRole = cancelledByRole as any;
        a.cancellationReason = reason;
        a.cancelledAt = new Date();
        count++;
      }
    }
    return count;
  }

  async findBlockedDateById(id: string) {
    return this.blockedDates.find((bd) => bd.id === id) ?? null;
  }

  async deleteBlockedDate(id: string) {
    this.blockedDates = this.blockedDates.filter((bd) => bd.id !== id);
  }

  async createInvitationToken(email: string, barbershopId: string, role: InvitationRole, tokenHash: string, expiresAt: Date) {
    this.invitationTokens.push({
      tokenHash,
      email,
      barbershopId,
      role,
      expiresAt,
      consumedAt: null,
      createdAt: new Date(),
    });
  }
}
