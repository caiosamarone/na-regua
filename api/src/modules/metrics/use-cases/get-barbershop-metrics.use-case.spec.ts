import { InMemoryMetricsRepository } from "../../../tests/helpers/in-memory-metrics.repository";
import { GetBarbershopMetricsUseCase } from "./get-barbershop-metrics.use-case";

describe("GetBarbershopMetricsUseCase", () => {
  let repo: InMemoryMetricsRepository;
  let useCase: GetBarbershopMetricsUseCase;

  const shopId = "shop-1";
  const from = new Date("2026-07-01T00:00:00Z");
  const to = new Date("2026-08-01T00:00:00Z");

  beforeEach(() => {
    repo = new InMemoryMetricsRepository();
    useCase = new GetBarbershopMetricsUseCase(repo);
  });

  afterEach(() => {
    repo.reset();
  });

  it("should return zeros and empty arrays when no data", async () => {
    const result = await useCase.execute(shopId, from, to);

    expect(result).toEqual({
      totalRevenue: 0,
      topServices: [],
      topBarbers: [],
      busiestDays: [],
    });
  });

  it("should compute metrics from DONE appointments only", async () => {
    repo.appointments.push(
      { barbershopId: shopId, status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 50, serviceName: "Corte", barberId: "b1" } as any,
      { barbershopId: shopId, status: "DONE", startTime: new Date("2026-07-15T11:00:00Z"), priceAtBooking: 30, serviceName: "Barba", barberId: "b1" } as any,
      { barbershopId: shopId, status: "DONE", startTime: new Date("2026-07-16T14:00:00Z"), priceAtBooking: 100, serviceName: "Corte", barberId: "b2" } as any,
      { barbershopId: shopId, status: "CANCELLED", startTime: new Date("2026-07-17T10:00:00Z"), priceAtBooking: 999 } as any,
      { barbershopId: shopId, status: "BOOKED", startTime: new Date("2026-07-20T10:00:00Z"), priceAtBooking: 999 } as any,
    );

    const result = await useCase.execute(shopId, from, to);

    expect(result.totalRevenue).toBe(180);
    expect(result.topServices).toHaveLength(2);
    expect(result.topServices[0].serviceName).toBe("Corte");
    expect(result.topServices[0].revenue).toBe(150);
    expect(result.topBarbers).toHaveLength(2);
    expect(result.busiestDays).toHaveLength(2);
  });

  it("should not include appointments from other barbershops", async () => {
    repo.appointments.push(
      { barbershopId: shopId, status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 50 } as any,
      { barbershopId: "other-shop", status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 999 } as any,
    );

    const result = await useCase.execute(shopId, from, to);
    expect(result.totalRevenue).toBe(50);
  });

  it("should exclude appointments outside date range", async () => {
    repo.appointments.push(
      { barbershopId: shopId, status: "DONE", startTime: new Date("2026-06-30T23:59:59Z"), priceAtBooking: 999 } as any,
      { barbershopId: shopId, status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 50 } as any,
    );

    const result = await useCase.execute(shopId, from, to);
    expect(result.totalRevenue).toBe(50);
  });
});
