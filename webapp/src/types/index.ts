export type UserRole = "SUPER_ADMIN" | "BARBERSHOP_ADMIN" | "BARBER";

export type StaffMember = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  user: StaffMember;
};

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type Barbershop = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  active: boolean;
};

export type Appointment = {
  id: string;
  dateTime: string;
  status: AppointmentStatus;
  customer: { id: string; name: string | null; email: string };
  barber: { id: string; name: string };
  service: { id: string; name: string; duration: number; price: number };
  barbershopId: string;
  notes: string | null;
};
