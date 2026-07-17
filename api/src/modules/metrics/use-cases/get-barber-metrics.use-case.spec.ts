import { InMemoryMetricsRepository } from "../../../tests/helpers/in-memory-metrics.repository";
import { GetBarberMetricsUseCase } from "./get-barber-metrics.use-case";

describe("GetBarberMetricsUseCase", () => {
  let repo: InMemoryMetricsRepository;
  let useCase: GetBarberMetricsUseCase;

  const barberId = "barber-1";
  const from = new Date("2026-07-01T00:00:00Z");
  const to = new Date("2026-08-01T00:00:00Z");

  beforeEach(() => {
    repo = new InMemoryMetricsRepository();
    useCase = new GetBarberMetricsUseCase(repo);
  });

  afterEach(() => {
    repo.reset();
  });

  it("should return zeros when no data", async () => {
    const result = await useCase.execute(barberId, from, to);

    expect(result).toEqual({
      totalDone: 0,
      revenue: 0,
      topServices: [],
      avgPerDay: 0,
    });
  });

  it("should compute barber metrics from DONE appointments", async () => {
    repo.appointments.push(
      { barberId, status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 50, serviceName: "Corte" } as any,
      { barberId, status: "DONE", startTime: new Date("2026-07-15T11:00:00Z"), priceAtBooking: 30, serviceName: "Barba" } as any,
      { barberId, status: "DONE", startTime: new Date("2026-07-16T14:00:00Z"), priceAtBooking: 100, serviceName: "Corte" } as any,
      { barberId, status: "CANCELLED", startTime: new Date("2026-07-17T10:00:00Z"), priceAtBooking: 999 } as any,
      { barberId: "other-barber", status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 999 } as any,
    );

    const result = await useCase.execute(barberId, from, to);

    expect(result.totalDone).toBe(3);
    expect(result.revenue).toBe(180);
    expect(result.topServices).toHaveLength(2);
    expect(result.topServices[0].serviceName).toBe("Corte");
    expect(result.topServices[0].bookingCount).toBe(2);
    expect(result.avgPerDay).toBeGreaterThan(0);
  });

  it("should exclude appointments outside date range", async () => {
    repo.appointments.push(
      { barberId, status: "DONE", startTime: new Date("2026-06-30T23:59:59Z"), priceAtBooking: 999 } as any,
      { barberId, status: "DONE", startTime: new Date("2026-07-15T10:00:00Z"), priceAtBooking: 50 } as any,
    );

    const result = await useCase.execute(barberId, from, to);
    expect(result.totalDone).toBe(1);
    expect(result.revenue).toBe(50);
  });
});
