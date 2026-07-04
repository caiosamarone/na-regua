import type {
  Barbershop,
  OperatingHour,
  Service,
} from "../../../generated/prisma/client";

export type BarbershopNearbyItem = Pick<
  Barbershop,
  "id" | "name" | "slug" | "address" | "neighborhood" | "city" | "state" | "phone" | "logoUrl" | "latitude" | "longitude"
> & { distanceKm: number | null };

export type BarbershopProfile = Barbershop & {
  operatingHours: OperatingHour[];
  services: Service[];
};

export interface BarbershopRepository {
  findById(id: string): Promise<Barbershop | null>;
  findBySlug(slug: string): Promise<Barbershop | null>;
  findNearby(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<BarbershopNearbyItem[]>;
  search(query: string): Promise<BarbershopNearbyItem[]>;
  findOperatingHours(barbershopId: string): Promise<OperatingHour[]>;
  findServices(barbershopId: string): Promise<Service[]>;
}
