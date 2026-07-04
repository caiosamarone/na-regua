import type { StaffMember, StaffRole } from "../../generated/prisma/client";
import type { StaffRepository, CreateStaffInput, UpdateStaffInput } from "../../modules/staff/gateways/staff.repository";

type StoredStaff = {
  id: string;
  barbershopId: string | null;
  email: string;
  passwordHash: string;
  name: string;
  role: StaffRole;
  isBookable: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class InMemoryStaffRepository implements StaffRepository {
  staff: StoredStaff[] = [];
  futureBookings: Array<{ id: string; startTime: Date; customerId: string; barberId: string }> = [];

  reset() {
    this.staff = [];
    this.futureBookings = [];
  }

  async findByBarbershopId(barbershopId: string, includeInactive = false) {
    return this.staff
      .filter((s) => s.barbershopId === barbershopId && (includeInactive || s.isActive))
      .sort((a, b) => a.name.localeCompare(b.name)) as any;
  }

  async findById(id: string) {
    return this.staff.find((s) => s.id === id) as any ?? null;
  }

  async findByEmail(email: string) {
    return this.staff.find((s) => s.email === email) as any ?? null;
  }

  async create(data: CreateStaffInput) {
    const now = new Date();
    const s: StoredStaff = {
      id: `staff-${this.staff.length + 1}`,
      barbershopId: data.barbershopId,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role as StaffRole,
      isBookable: data.role === "BARBER",
      isActive: true,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    this.staff.push(s);
    return { ...s, barbershop: null, appointments: [], refreshTokens: [], otpTokens: [] } as any;
  }

  async update(id: string, data: UpdateStaffInput) {
    const s = this.staff.find((s) => s.id === id);
    if (!s) throw new Error("Not found");
    if (data.name) s.name = data.name;
    if (data.role) s.role = data.role as StaffRole;
    s.updatedAt = new Date();
    return { ...s, barbershop: null, appointments: [], refreshTokens: [], otpTokens: [] } as any;
  }

  async toggleBookable(id: string, isBookable: boolean) {
    const s = this.staff.find((s) => s.id === id);
    if (!s) throw new Error("Not found");
    s.isBookable = isBookable;
    s.updatedAt = new Date();
    return { ...s, barbershop: null, appointments: [], refreshTokens: [], otpTokens: [] } as any;
  }

  async softDelete(id: string) {
    const s = this.staff.find((s) => s.id === id);
    if (s) {
      s.isActive = false;
      s.updatedAt = new Date();
    }
  }

  async findFutureBookings(staffId: string) {
    return this.futureBookings.filter((b) => b.barberId === staffId);
  }
}
