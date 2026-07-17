import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaMetricsRepository } from "../gateways/prisma-metrics.repository";
import { GetAdminMetricsUseCase } from "../use-cases/get-admin-metrics.use-case";
import { metricsQuerySchema } from "../models/metrics.schema";

const repository = new PrismaMetricsRepository();
const useCase = new GetAdminMetricsUseCase(repository);

export class GetAdminMetricsController {
  async handle(
    request: FastifyRequest<{ Querystring: { from?: string; to?: string } }>,
    reply: FastifyReply,
  ) {
    const query = metricsQuerySchema.parse(request.query);
    const from = new Date(`${query.from}T00:00:00Z`);
    const to = new Date(`${query.to}T23:59:59Z`);

    const result = await useCase.execute(from, to);

    return reply.code(200).send({ data: result });
  }
}
