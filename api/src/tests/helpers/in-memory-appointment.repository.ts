import type {
  Appointment,
  Barbershop,
  Service,
  StaffMember,
  Customer,
  OperatingHour,
  BlockedDate,
} from "../../generated/prisma/client";
import type {
  AppointmentRepository,
  AppointmentWithRelations,
  StaffProfile,
  ServiceProfile,
} from "../../modules/booking/gateways/appointment.repository";

type StoredAppointment = Appointment & {
  customer?: { id: string; name: string; email: string } | null;
  barber?: { id: string; name: string } | null;
  service?: { name: string } | null;
};

export class InMemoryAppointmentRepository implements AppointmentRepository {
  appointments: StoredAppointment[] = [];
  barbershops: Barbershop[] = [];
  services: Service[] = [];
  staffMembers: StaffMember[] = [];
  operatingHours: OperatingHour[] = [];
  blockedDates: BlockedDate[] = [];

  reset() {
    this.appointments = [];
    this.barbershops = [];
    this.services = [];
    this.staffMembers = [];
    this.operatingHours = [];
    this.blockedDates = [];
  }

  async findById(id: string) {
    return (this.appointments.find((a) => a.id === id) ?? null) as any;
  }

  async findByIdWithRelations(id: string) {
    const a = this.appointments.find((ap) => ap.id === id);
    if (!a) return null;
    return {
      ...a,
      customer: a.customer ?? null,
      barber: a.barber ?? null,
      service: a.service ?? null,
      priceAtBooking: Number(a.priceAtBooking),
    } as unknown as AppointmentWithRelations;
  }

  async findByCustomerId(
    customerId: string,
    options: { status?: string; from?: Date; to?: Date; page: number; pageSize: number },
  ) {
    let filtered = this.appointments.filter((a) => a.customerId === customerId);
    if (options.status) filtered = filtered.filter((a) => a.status === options.status);
    if (options.from) filtered = filtered.filter((a) => new Date(a.startTime) >= options.from!);
    if (options.to) filtered = filtered.filter((a) => new Date(a.startTime) <= options.to!);
    filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    const total = filtered.length;
    const skip = (options.page - 1) * options.pageSize;
    const data = filtered.slice(skip, skip + options.pageSize);
    return {
      data: data.map((a) => ({
        ...a,
        customer: a.customer ?? null,
        barber: a.barber ?? null,
        service: a.service ?? null,
        priceAtBooking: Number(a.priceAtBooking),
      })) as unknown as AppointmentWithRelations[],
      total,
    };
  }

  async findByBarbershopId(
    barbershopId: string,
    options: { status?: string; from?: Date; to?: Date; barberId?: string; page: number; pageSize: number },
  ) {
    let filtered = this.appointments.filter((a) => a.barbershopId === barbershopId);
    if (options.status) filtered = filtered.filter((a) => a.status === options.status);
    if (options.barberId) filtered = filtered.filter((a) => a.barberId === options.barberId);
    if (options.from) filtered = filtered.filter((a) => new Date(a.startTime) >= options.from!);
    if (options.to) filtered = filtered.filter((a) => new Date(a.startTime) <= options.to!);
    filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    const total = filtered.length;
    const skip = (options.page - 1) * options.pageSize;
    const data = filtered.slice(skip, skip + options.pageSize);
    return {
      data: data.map((a) => ({
        ...a,
        customer: a.customer ?? null,
        barber: a.barber ?? null,
        service: a.service ?? null,
        priceAtBooking: Number(a.priceAtBooking),
      })) as unknown as AppointmentWithRelations[],
      total,
    };
  }

  async findBookedInRange(barberId: string, startDate: Date, endDate: Date) {
    return this.appointments.filter(
      (a) =>
        a.barberId === barberId &&
        a.status === "BOOKED" &&
        new Date(a.startTime) < endDate &&
        new Date(a.endTime) > startDate,
    ) as any;
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
    const now = new Date();
    const appointment = {
      id: `apt-${this.appointments.length + 1}`,
      ...data,
      priceAtBooking: data.priceAtBooking as any,
      status: "BOOKED" as const,
      cancelledById: null,
      cancelledByRole: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
      customer: null,
      barber: null,
      service: null,
    } as StoredAppointment;
    this.appointments.push(appointment);
    return appointment as any;
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
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Appointment not found");
    this.appointments[idx] = {
      ...this.appointments[idx],
      status,
      ...(cancelData
        ? {
            cancelledById: cancelData.cancelledById,
            cancelledByRole: cancelData.cancelledByRole,
            cancellationReason: cancelData.cancellationReason ?? null,
            cancelledAt: cancelData.cancelledAt,
          }
        : {}),
      updatedAt: new Date(),
    };
    return this.appointments[idx] as any;
  }

  async findBarbershopById(id: string) {
    return (this.barbershops.find((b) => b.id === id) ?? null) as any;
  }

  async findServiceById(id: string) {
    const s = this.services.find((svc) => svc.id === id);
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: s.price,
      isActive: s.isActive,
    } as ServiceProfile;
  }

  async findStaffById(id: string) {
    const s = this.staffMembers.find((st) => st.id === id);
    if (!s) return null;
    return { id: s.id, name: s.name, barbershopId: s.barbershopId } as StaffProfile;
  }

  async findOperatingHours(barbershopId: string, dayOfWeek: number) {
    return this.operatingHours.filter(
      (oh) => oh.barbershopId === barbershopId && oh.dayOfWeek === dayOfWeek,
    ) as any;
  }

  async findBlockedDates(barbershopId: string, date: Date) {
    return this.blockedDates.filter(
      (bd) =>
        bd.barbershopId === barbershopId &&
        new Date(bd.startDate) <= date &&
        new Date(bd.endDate) >= date,
    ) as any;
  }
}
