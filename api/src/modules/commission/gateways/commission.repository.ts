import type {
  CommissionEntry,
  CommissionPayment,
  CommissionStatus,
  Appointment,
  Service,
  Customer,
} from "../../../generated/prisma/client";

export type CreateCommissionEntryInput = {
  barbershopId: string;
  staffMemberId: string;
  appointmentId: string;
  commissionPercent: number;
  priceAtBooking: number;
  amount: number;
};

export type BarberCommissionSummary = {
  staffMemberId: string;
  name: string;
  commissionPercent: number | null;
  pendingAmount: number;
  paidThisMonth: number;
  pendingEntries: number;
  paidEntriesThisMonth: number;
};

export type BarberCommissionEntry = CommissionEntry & {
  appointment: Pick<Appointment, "startTime" | "priceAtBooking"> & {
    service: Pick<Service, "name">;
    customer: Pick<Customer, "name">;
  };
};

export type BarberCommissionDetail = {
  id: string;
  appointmentId: string;
  serviceName: string;
  customerName: string;
  appointmentDate: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: Date;
};

export interface CommissionRepository {
  findByAppointmentId(appointmentId: string): Promise<CommissionEntry | null>;
  createEntry(data: CreateCommissionEntryInput): Promise<CommissionEntry>;

  findBarbershopSummary(
    barbershopId: string,
    from?: Date,
    to?: Date,
    barberId?: string,
    status?: CommissionStatus,
    page?: number,
    pageSize?: number,
  ): Promise<{ barbers: BarberCommissionSummary[]; total: number }>;

  findBarberEntries(
    staffMemberId: string,
    barbershopId: string,
    from?: Date,
    to?: Date,
    status?: CommissionStatus,
  ): Promise<BarberCommissionEntry[]>;

  findPendingByBarber(
    barbershopId: string,
    staffMemberId?: string,
  ): Promise<CommissionEntry[]>;

  payEntries(
    entryIds: string[],
    barbershopId: string,
    staffMemberId?: string,
    notes?: string,
  ): Promise<CommissionPayment>;

  getBarberTotals(
    staffMemberId: string,
    barbershopId: string,
  ): Promise<{
    totalGenerated: number;
    pendingAmount: number;
    paidAmount: number;
    commissionPercent: number | null;
  }>;
}
