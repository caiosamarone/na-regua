import type { StaffMember, StaffRole } from "../../../generated/prisma/client";

export type CreateStaffInput = {
  barbershopId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: StaffRole;
};

export type UpdateStaffInput = {
  name?: string;
  role?: StaffRole;
  isBookable?: boolean;
};

export interface StaffRepository {
  findByBarbershopId(barbershopId: string, includeInactive?: boolean): Promise<StaffMember[]>;
  findById(id: string): Promise<StaffMember | null>;
  findByEmail(email: string): Promise<StaffMember | null>;
  create(data: CreateStaffInput): Promise<StaffMember>;
  update(id: string, data: UpdateStaffInput): Promise<StaffMember>;

  softDelete(id: string): Promise<void>;
  findFutureBookings(staffId: string): Promise<Array<{ id: string; startTime: Date; customerId: string }>>;
}
