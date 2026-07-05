import type {
  Appointment,
  Customer,
  StaffMember,
  Service,
  Barbershop,
  OperatingHour,
  BlockedDate,
} from "../../../generated/prisma/client";

export type AppointmentWithRelations = Appointment & {
  customer: Pick<Customer, "id" | "name" | "email"> | null;
  barber: Pick<StaffMember, "id" | "name"> | null;
  service: Pick<Service, "name"> | null;
};

export type StaffProfile = Pick<StaffMember, "id" | "name" | "barbershopId">;
export type ServiceProfile = Pick<Service, "id" | "name" | "durationMinutes" | "price" | "isActive">;

export interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByIdWithRelations(id: string): Promise<AppointmentWithRelations | null>;
  findByCustomerId(
    customerId: string,
    options: { status?: string; from?: Date; to?: Date; page: number; pageSize: number },
  ): Promise<{ data: Appointment[]; total: number }>;
  findByBarbershopId(
    barbershopId: string,
    options: { status?: string; from?: Date; to?: Date; barberId?: string; page: number; pageSize: number },
  ): Promise<{ data: AppointmentWithRelations[]; total: number }>;
  findBookedInRange(barberId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
  create(data: {
    barbershopId: string;
    customerId: string;
    barberId: string;
    serviceId: string;
    serviceName: string;
    priceAtBooking: number;
    durationAtBooking: number;
    startTime: Date;
    endTime: Date;
  }): Promise<Appointment>;
  updateStatus(
    id: string,
    status: "CANCELLED" | "DONE",
    cancelData?: {
      cancelledById: string;
      cancelledByRole: "CUSTOMER" | "BARBER" | "BARBERSHOP_ADMIN";
      cancellationReason?: string | null;
      cancelledAt: Date;
    },
  ): Promise<Appointment>;
  findBarbershopById(id: string): Promise<Barbershop | null>;
  findServiceById(id: string): Promise<ServiceProfile | null>;
  findStaffById(id: string): Promise<StaffProfile | null>;
  findOperatingHours(barbershopId: string, dayOfWeek: number): Promise<OperatingHour[]>;
  findBlockedDates(barbershopId: string, date: Date): Promise<BlockedDate[]>;
}
