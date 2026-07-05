import type { Service } from "../../../generated/prisma/client";

export type CreateServiceInput = {
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
};

export type UpdateServiceInput = {
  name?: string;
  description?: string | null;
  durationMinutes?: number;
  price?: number;
};

export interface ServiceRepository {
  findByBarbershopId(barbershopId: string, includeInactive?: boolean): Promise<Service[]>;
  findById(id: string): Promise<Service | null>;
  create(barbershopId: string, data: CreateServiceInput): Promise<Service>;
  update(id: string, data: UpdateServiceInput): Promise<Service>;
  softDelete(id: string): Promise<void>;
}
