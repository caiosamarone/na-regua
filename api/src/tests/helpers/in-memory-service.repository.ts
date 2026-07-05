import type { Service } from "../../generated/prisma/client";
import type {
  ServiceRepository,
  CreateServiceInput,
  UpdateServiceInput,
} from "../../modules/services/gateways/service.repository";

export class InMemoryServiceRepository implements ServiceRepository {
  services: Service[] = [];

  reset() {
    this.services = [];
  }

  async findByBarbershopId(barbershopId: string, includeInactive = false) {
    return this.services.filter(
      (s) =>
        s.barbershopId === barbershopId &&
        (includeInactive || s.isActive),
    );
  }

  async findById(id: string) {
    return this.services.find((s) => s.id === id) ?? null;
  }

  async create(barbershopId: string, data: CreateServiceInput) {
    const now = new Date();
    const service = {
      id: `svc-${this.services.length + 1}`,
      barbershopId,
      name: data.name,
      description: data.description ?? null,
      durationMinutes: data.durationMinutes,
      price: data.price as any,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as Service;
    this.services.push(service);
    return service;
  }

  async update(id: string, data: UpdateServiceInput) {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Service not found");
    const existing = this.services[idx];
    const updated = {
      ...existing,
      ...data,
      price: data.price != null ? (data.price as any) : existing.price,
      updatedAt: new Date(),
    } as Service;
    this.services[idx] = updated;
    return updated;
  }

  async softDelete(id: string) {
    const idx = this.services.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Service not found");
    this.services[idx] = { ...this.services[idx], isActive: false, updatedAt: new Date() };
  }
}
