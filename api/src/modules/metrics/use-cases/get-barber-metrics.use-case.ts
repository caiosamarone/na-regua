import { MetricsRepository } from "../gateways/metrics.repository";

export class GetBarberMetricsUseCase {
  constructor(private metricsRepository: MetricsRepository) {}

  async execute(barberId: string, from: Date, to: Date) {
    const [totalDone, revenue, topServices, avgPerDayData] = await Promise.all([
      this.metricsRepository.getBarberTotalDone(barberId, from, to),
      this.metricsRepository.getBarberRevenue(barberId, from, to),
      this.metricsRepository.getBarberTopServices(barberId, from, to),
      this.metricsRepository.getBarberAvgPerDay(barberId, from, to),
    ]);

    return {
      totalDone,
      revenue,
      topServices,
      avgPerDay: avgPerDayData.avgPerDay,
    };
  }
}
