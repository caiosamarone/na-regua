import { MetricsRepository } from "../gateways/metrics.repository";

export class GetAdminMetricsUseCase {
  constructor(private metricsRepository: MetricsRepository) {}

  async execute(from: Date, to: Date) {
    const [activeBarbershops, totalRevenue, totalDone, totalCancelled, topBarbershops] =
      await Promise.all([
        this.metricsRepository.getActiveBarbershopsCount(),
        this.metricsRepository.getGlobalTotalRevenue(from, to),
        this.metricsRepository.getGlobalTotalDone(from, to),
        this.metricsRepository.getGlobalTotalCancelled(from, to),
        this.metricsRepository.getTopBarbershops(from, to),
      ]);

    return { activeBarbershops, totalRevenue, totalDone, totalCancelled, topBarbershops };
  }
}
