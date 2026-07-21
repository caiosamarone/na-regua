import type { TimeOff } from "../../../generated/prisma/client";

export type CreateTimeOffData = {
  barbershopId: string;
  staffMemberId: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
};

export type AffectedAppointment = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  startTime: string;
  serviceName: string;
};

export interface TimeOffRepository {
  findById(id: string): Promise<TimeOff | null>;
  findByStaffMember(staffMemberId: string): Promise<TimeOff[]>;
  findByBarbershop(barbershopId: string): Promise<TimeOff[]>;
  findInRange(staffMemberId: string, startDate: Date, endDate: Date): Promise<TimeOff[]>;
  create(data: CreateTimeOffData): Promise<TimeOff>;
  delete(id: string): Promise<void>;
  findAppointmentsInRange(
    staffMemberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AffectedAppointment[]>;
  cancelAppointmentsInRange(
    staffMemberId: string,
    startDate: Date,
    endDate: Date,
    cancelledById: string,
    cancelledByRole: string,
    reason: string | null,
  ): Promise<number>;
}
