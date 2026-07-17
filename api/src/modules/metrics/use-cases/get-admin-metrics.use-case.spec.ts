import { InMemoryMetricsRepository } from "../../../tests/helpers/in-memory-metrics.repository";
import { GetAdminMetricsUseCase } from "./get-admin-metrics.use-case";

describe("GetAdminMetricsUseCase", () => {
  let repo: InMemoryMetricsRepository;
  let useCase: GetAdminMetricsUseCase;

  const from = new Date("2026-07-01T00:00:00Z");
  const to = new Date("2026-08-01T00:00:00Z");

  beforeEach(() => {
    repo = new InMemoryMetricsRepository();
    useCase = new GetAdminMetricsUseCase(repo);
  });

  afterEach(() => {
    repo.reset();
  });

  it("should return zeros when no data exists", async () => {
    const result = await useCase.execute(from, to);

    expect(result).toEqual({
      activeBarbershops: 0,
      totalRevenue: 0,
      totalDone: 0,
      totalCancelled: 0,
      topBarbershops: [],
    });
  });

  it("should count active barbershops", async () => {
    repo.barbershops.push(
      { id: "s1", name: "Barbearia A", active: true } as any,
      { id: "s2", name: "Barbearia B", active: true } as any,
      { id: "s3", name: "Barbearia C", active: false } as any,
    );

    const result = await useCase.execute(from, to);
    expect(result.activeBarbershops).toBe(2);
  });

  it("should aggregate global metrics correctly", async () => {
    repo.barbershops.push(
      { id: "s1", name: "Barbearia A", active: true } as any,
      { id: "s2", name: "Barbearia B", active: true } as any,
    );

    repo.appointments.push(
      { id: "a1", barbershopId: "s1", status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 50 } as any,
      { id: "a2", barbershopId: "s2", status: "DONE", startTime: new Date("2026-07-16T14:00:00Z"), priceAtBooking: 80 } as any,
      { id: "a3", barbershopId: "s2", status: "CANCELLED", startTime: new Date("2026-07-17T10:00:00Z"), priceAtBooking: 40 } as any,
      { id: "a4", barbershopId: "s1", status: "BOOKED", startTime: new Date("2026-07-20T10:00:00Z"), priceAtBooking: 60 } as any,
    );

    const result = await useCase.execute(from, to);

    expect(result.totalRevenue).toBe(130);
    expect(result.totalDone).toBe(2);
    expect(result.totalCancelled).toBe(1);
  });

  it("should return top barbershops sorted by revenue", async () => {
    repo.barbershops.push(
      { id: "s1", name: "Barbearia A", active: true } as any,
      { id: "s2", name: "Barbearia B", active: true } as any,
    );
    repo.appointments.push(
      { id: "a1", barbershopId: "s1", status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 100 } as any,
      { id: "a2", barbershopId: "s2", status: "DONE", startTime: new Date("2026-07-16T14:00:00Z"), priceAtBooking: 200 } as any,
    );

    const result = await useCase.execute(from, to);
    expect(result.topBarbershops).toHaveLength(2);
    expect(result.topBarbershops[0].barbershopName).toBe("Barbearia B");
    expect(result.topBarbershops[0].revenue).toBe(200);
  });

  it("should not include inactive barbershops in top list", async () => {
    repo.barbershops.push(
      { id: "s1", name: "Barbearia A", active: true } as any,
      { id: "s2", name: "Barbearia B", active: false } as any,
    );
    repo.appointments.push(
      { id: "a1", barbershopId: "s2", status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 999 } as any,
    );

    const result = await useCase.execute(from, to);
    expect(result.topBarbershops).toHaveLength(1);
    expect(result.topBarbershops[0].barbershopId).toBe("s1");
  });

  it("should exclude appointments outside date range", async () => {
    repo.barbershops.push({ id: "s1", name: "Barbearia A", active: true } as any);
    repo.appointments.push(
      { id: "a1", barbershopId: "s1", status: "DONE", startTime: new Date("2026-06-30T23:59:59Z"), priceAtBooking: 999 } as any,
      { id: "a2", barbershopId: "s1", status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 50 } as any,
    );

    const result = await useCase.execute(from, to);
    expect(result.totalRevenue).toBe(50);
    expect(result.totalDone).toBe(1);
  });
});
