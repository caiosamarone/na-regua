import type { TimeOff } from "../../generated/prisma/client";
import type {
  TimeOffRepository,
  CreateTimeOffData,
  AffectedAppointment,
} from "../../modules/timeoff/gateways/timeoff.repository";

export class InMemoryTimeOffRepository implements TimeOffRepository {
  timeOffs: TimeOff[] = [];
  appointments: AffectedAppointment[] = [];

  async findById(id: string) {
    return this.timeOffs.find((t) => t.id === id) ?? null;
  }

  async findByStaffMember(staffMemberId: string) {
    return this.timeOffs
      .filter((t) => t.staffMemberId === staffMemberId)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async findByBarbershop(barbershopId: string) {
    return this.timeOffs
      .filter((t) => t.barbershopId === barbershopId)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async findInRange(staffMemberId: string, startDate: Date, endDate: Date) {
    return this.timeOffs.filter(
      (t) =>
        t.staffMemberId === staffMemberId &&
        t.startDate <= endDate &&
        t.endDate >= startDate,
    );
  }

  async create(data: CreateTimeOffData) {
    const timeOff: TimeOff = {
      id: `timeoff-${this.timeOffs.length + 1}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.timeOffs.push(timeOff);
    return timeOff;
  }

  async delete(id: string) {
    this.timeOffs = this.timeOffs.filter((t) => t.id !== id);
  }

  async findAppointmentsInRange(
    _staffMemberId: string,
    _startDate: Date,
    _endDate: Date,
  ) {
    return this.appointments;
  }

  async cancelAppointmentsInRange(
    _staffMemberId: string,
    _startDate: Date,
    _endDate: Date,
    _cancelledById: string,
    _cancelledByRole: string,
    _reason: string | null,
  ) {
    const count = this.appointments.length;
    this.appointments = [];
    return count;
  }
}
