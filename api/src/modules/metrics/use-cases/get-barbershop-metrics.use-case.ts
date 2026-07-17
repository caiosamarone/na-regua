import { MetricsRepository } from "../gateways/metrics.repository";

export class GetBarbershopMetricsUseCase {
  constructor(private metricsRepository: MetricsRepository) {}

  async execute(barbershopId: string, from: Date, to: Date) {
    const [totalRevenue, topServices, topBarbers, busiestDays] = await Promise.all([
      this.metricsRepository.getBarbershopRevenue(barbershopId, from, to),
      this.metricsRepository.getTopServices(barbershopId, from, to),
      this.metricsRepository.getTopBarbers(barbershopId, from, to),
      this.metricsRepository.getBusiestDays(barbershopId, from, to),
    ]);

    return { totalRevenue, topServices, topBarbers, busiestDays };
  }
}
