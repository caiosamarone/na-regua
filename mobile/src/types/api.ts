// Shapes returned by the API (api/src/modules/*/models). Keep in sync with the API contract.

export type Envelope<T> = { data: T };
export type Paginated<T> = { data: T[]; meta: { page: number; pageSize: number; total: number } };

export type StaffRole = 'SUPER_ADMIN' | 'BARBERSHOP_ADMIN' | 'BARBER';
export type AppointmentStatus = 'BOOKED' | 'CANCELLED' | 'DONE';

export type AuthTokens = { accessToken: string; refreshToken: string };
export type CustomerPayload = { id: string; name: string; email: string };
export type StaffPayload = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  barbershopId?: string | null;
};

export type BarbershopListItem = {
  id: string;
  name: string;
  slug: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string | null;
  logoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number | null;
};

export type OperatingHour = { dayOfWeek: number; startTime: string; endTime: string };

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
};

export type BookableStaff = { id: string; name: string; role: string; avatarUrl: string | null };

export type BarbershopProfile = {
  id: string;
  name: string;
  slug: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  timezone: string;
  phone: string | null;
  logoUrl: string | null;
  slotIntervalMinutes: number;
  cancellationLeadTimeMinutes: number;
  active: boolean;
  operatingHours: OperatingHour[];
  services: PublicService[];
  staff: BookableStaff[];
};

export type Slot = { startTimeLocal: string; startTimeUtc: string; endTimeUtc: string };

export type Appointment = {
  id: string;
  barbershopId: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  serviceName: string;
  priceAtBooking: number;
  durationAtBooking: number;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  barber?: { id: string; name: string };
  customer?: { id: string; name: string; email: string };
  service?: { name: string };
};

/** Customer cancellations inside the lead time come back with a warning about the 50% charge. */
export type CancelAppointmentResult = Appointment & { warning?: string };

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isBookable: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  commissionPercent: number | null;
};

export type AdminService = PublicService & { isActive: boolean };

export type BarberCommissions = {
  commissionPercent: number | null;
  totalGenerated: number;
  pendingAmount: number;
  paidAmount: number;
  entries: {
    id: string;
    appointmentId: string;
    serviceName: string;
    customerName: string;
    appointmentDate: string;
    amount: number;
    status: 'PENDING' | 'PAID';
  }[];
};

export type BarbershopMetrics = {
  totalRevenue: number;
  topServices: { serviceName: string; bookingCount: number; revenue: number }[];
  topBarbers: { barberId: string; appointmentCount: number; revenue: number }[];
  busiestDays: { date: string; appointmentCount: number }[];
};
