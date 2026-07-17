import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaMetricsRepository } from "../gateways/prisma-metrics.repository";
import { GetBarberMetricsUseCase } from "../use-cases/get-barber-metrics.use-case";
import { metricsQuerySchema } from "../models/metrics.schema";

const repository = new PrismaMetricsRepository();
const useCase = new GetBarberMetricsUseCase(repository);

export class GetBarberMetricsController {
  async handle(
    request: FastifyRequest<{ Querystring: { from?: string; to?: string } }>,
    reply: FastifyReply,
  ) {
    const payload = request.user as { sub: string };
    const query = metricsQuerySchema.parse(request.query);
    const from = new Date(`${query.from}T00:00:00Z`);
    const to = new Date(`${query.to}T23:59:59Z`);

    const result = await useCase.execute(payload.sub, from, to);

    return reply.code(200).send({ data: result });
  }
}
