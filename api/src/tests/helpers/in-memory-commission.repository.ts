import type {
  CommissionEntry,
  CommissionPayment,
  CommissionStatus,
  StaffMember,
} from "../../generated/prisma/client";
import type {
  CommissionRepository,
  CreateCommissionEntryInput,
  BarberCommissionSummary,
} from "../../modules/commission/gateways/commission.repository";

type StoredEntry = Omit<CommissionEntry, "staffMember" | "appointment" | "barbershop" | "payment"> & {
  paymentId: string | null;
  appointment: {
    startTime: Date;
    priceAtBooking: any;
    service: { name: string };
    customer: { name: string };
  };
};
type StoredPayment = Omit<CommissionPayment, "staffMember" | "barbershop" | "entries">;

export class InMemoryCommissionRepository implements CommissionRepository {
  entries: StoredEntry[] = [];
  payments: StoredPayment[] = [];
  staff: StaffMember[] = [];

  reset() {
    this.entries = [];
    this.payments = [];
    this.staff = [];
  }

  async findByAppointmentId(appointmentId: string) {
    return this.entries.find((e) => e.appointmentId === appointmentId) ?? null;
  }

  async createEntry(data: CreateCommissionEntryInput) {
    const entry: StoredEntry = {
      id: `entry-${this.entries.length + 1}`,
      barbershopId: data.barbershopId,
      staffMemberId: data.staffMemberId,
      appointmentId: data.appointmentId,
      commissionPercent: data.commissionPercent as any,
      priceAtBooking: data.priceAtBooking as any,
      amount: data.amount as any,
      status: "PENDING",
      paidAt: null,
      paymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      appointment: {
        startTime: new Date(),
        priceAtBooking: data.priceAtBooking as any,
        service: { name: "Corte" },
        customer: { name: "Cliente" },
      },
    };
    this.entries.push(entry);
    return entry as any;
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
    const filteredStaff = this.staff.filter(
      (s) =>
        s.barbershopId === barbershopId &&
        (s.role === "BARBER" || s.role === "BARBERSHOP_ADMIN") &&
        s.isActive &&
        (!barberId || s.id === barberId),
    );

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const barbers: BarberCommissionSummary[] = filteredStaff.map((s) => {
      const staffEntries = this.entries.filter(
        (e) =>
          e.staffMemberId === s.id &&
          e.barbershopId === barbershopId &&
          (!status || e.status === status),
      );

      return {
        staffMemberId: s.id,
        name: s.name,
        commissionPercent: s.commissionPercent ? Number(s.commissionPercent) : null,
        pendingAmount: staffEntries
          .filter((e) => e.status === "PENDING")
          .reduce((sum, e) => sum + Number(e.amount), 0),
        paidThisMonth: staffEntries
          .filter((e) => e.status === "PAID" && e.paidAt && e.paidAt >= firstOfMonth)
          .reduce((sum, e) => sum + Number(e.amount), 0),
        pendingEntries: staffEntries.filter((e) => e.status === "PENDING").length,
        paidEntriesThisMonth: staffEntries.filter(
          (e) => e.status === "PAID" && e.paidAt && e.paidAt >= firstOfMonth,
        ).length,
      };
    });

    return { barbers, total: barbers.length };
  }

  async findBarberEntries(
    staffMemberId: string,
    barbershopId: string,
    from?: Date,
    to?: Date,
    status?: CommissionStatus,
  ) {
    return this.entries.filter(
      (e) =>
        e.staffMemberId === staffMemberId &&
        e.barbershopId === barbershopId &&
        (!status || e.status === status),
    ) as any;
  }

  async findPendingByBarber(barbershopId: string, staffMemberId?: string) {
    return this.entries.filter(
      (e) =>
        e.barbershopId === barbershopId &&
        e.status === "PENDING" &&
        (!staffMemberId || e.staffMemberId === staffMemberId),
    ) as any;
  }

  async payEntries(
    entryIds: string[],
    barbershopId: string,
    staffMemberId?: string,
    notes?: string,
  ) {
    const amount = this.entries
      .filter((e) => entryIds.includes(e.id))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const payment: StoredPayment = {
      id: `payment-${this.payments.length + 1}`,
      barbershopId,
      staffMemberId: staffMemberId ?? null,
      amount: amount as any,
      notes: notes ?? null,
      paidAt: new Date(),
      createdAt: new Date(),
    };
    this.payments.push(payment);

    for (const entry of this.entries) {
      if (entryIds.includes(entry.id)) {
        entry.status = "PAID";
        entry.paidAt = new Date();
        entry.paymentId = payment.id;
      }
    }

    return { ...payment, entries: this.entries.filter((e) => entryIds.includes(e.id)) } as any;
  }

  async getBarberTotals(staffMemberId: string, barbershopId: string) {
    const staff = this.staff.find((s) => s.id === staffMemberId);
    const entries = this.entries.filter(
      (e) => e.staffMemberId === staffMemberId && e.barbershopId === barbershopId,
    );

    return {
      totalGenerated: entries.reduce((sum, e) => sum + Number(e.amount), 0),
      pendingAmount: entries
        .filter((e) => e.status === "PENDING")
        .reduce((sum, e) => sum + Number(e.amount), 0),
      paidAmount: entries
        .filter((e) => e.status === "PAID")
        .reduce((sum, e) => sum + Number(e.amount), 0),
      commissionPercent: staff?.commissionPercent ? Number(staff.commissionPercent) : null,
    };
  }
}
