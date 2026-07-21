import type {
  Appointment,
  Barbershop,
  BlockedDate,
  Customer,
  GalleryImage,
  InvitationRole,
  OperatingHour,
  Service,
  StaffMember,
} from "../../../generated/prisma/client";

export type BarbershopNearbyItem = Pick<
  Barbershop,
  "id" | "name" | "slug" | "address" | "neighborhood" | "city" | "state" | "phone" | "logoUrl" | "latitude" | "longitude"
> & { distanceKm: number | null };

export type BarbershopProfile = Barbershop & {
  operatingHours: OperatingHour[];
  services: Service[];
  gallery: GalleryImage[];
};

export type OperatingHourInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type CreateBarbershopInput = {
  name: string;
  slug: string;
  address: string;
  cep: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone: string;
  phone?: string | null;
};

export type AppointmentWithRelations = Appointment & {
  customer: Pick<Customer, "id" | "name" | "email"> | null;
  service: { name: string } | null;
};

export type UpdateBarbershopProfileInput = {
  name?: string;
  address?: string;
  cep?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  phone?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  instagramUrl?: string | null;
  whatsappUrl?: string | null;
  facebookUrl?: string | null;
};

export interface BarbershopRepository {
  findById(id: string): Promise<Barbershop | null>;
  findBySlug(slug: string): Promise<Barbershop | null>;
  search(query: string | undefined, lat?: number, lng?: number, radiusKm?: number): Promise<BarbershopNearbyItem[]>;
  findOperatingHours(barbershopId: string): Promise<OperatingHour[]>;
  findServices(barbershopId: string, includeInactive?: boolean): Promise<Service[]>;
  findBookableStaff(barbershopId: string): Promise<StaffMember[]>;
  create(data: CreateBarbershopInput): Promise<Barbershop>;
  updateStatus(barbershopId: string, active: boolean): Promise<Barbershop>;
  updateProfile(barbershopId: string, data: UpdateBarbershopProfileInput): Promise<Barbershop>;
  replaceOperatingHours(barbershopId: string, hours: OperatingHourInput[]): Promise<void>;
  findBlockedDates(barbershopId: string): Promise<BlockedDate[]>;
  findAppointmentsInRange(barbershopId: string, startDate: Date, endDate: Date): Promise<AppointmentWithRelations[]>;
  createBlockedDate(barbershopId: string, startDate: Date, endDate: Date, reason: string | null): Promise<BlockedDate>;
  cancelAppointmentsInRange(barbershopId: string, startDate: Date, endDate: Date, cancelledById: string, cancelledByRole: string, reason: string | null): Promise<number>;
  findBlockedDateById(id: string): Promise<BlockedDate | null>;
  deleteBlockedDate(id: string): Promise<void>;
  createInvitationToken(email: string, barbershopId: string, role: InvitationRole, tokenHash: string, expiresAt: Date): Promise<void>;
  findGallery(barbershopId: string): Promise<GalleryImage[]>;
  findGalleryImageById(id: string): Promise<GalleryImage | null>;
  addGalleryImage(barbershopId: string, imageUrl: string, caption: string | null, sortOrder: number): Promise<GalleryImage>;
  reorderGallery(imageIds: string[]): Promise<void>;
  deleteGalleryImage(id: string): Promise<void>;
}
