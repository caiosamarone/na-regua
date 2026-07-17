import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaMetricsRepository } from "../gateways/prisma-metrics.repository";
import { GetBarbershopMetricsUseCase } from "../use-cases/get-barbershop-metrics.use-case";
import { metricsQuerySchema } from "../models/metrics.schema";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaMetricsRepository();
const useCase = new GetBarbershopMetricsUseCase(repository);

export class GetBarbershopMetricsController {
  async handle(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { from?: string; to?: string } }>,
    reply: FastifyReply,
  ) {
    const payload = request.user as { role: string; barbershopId?: string } | undefined;

    if (payload?.role !== "SUPER_ADMIN" && payload?.barbershopId !== request.params.id) {
      throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");
    }

    const query = metricsQuerySchema.parse(request.query);
    const from = new Date(`${query.from}T00:00:00Z`);
    const to = new Date(`${query.to}T23:59:59Z`);

    const result = await useCase.execute(request.params.id, from, to);

    return reply.code(200).send({ data: result });
  }
}
