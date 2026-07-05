import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaServiceRepository } from "../gateways/prisma-service.repository";
import { ListServicesUseCase } from "../use-cases/list-services.use-case";
import { listServicesQuerySchema } from "../models/service.schema";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaServiceRepository();
const useCase = new ListServicesUseCase(repository);

export class ListServicesController {
  async handle(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { all?: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const all = request.query.all === "true";

    if (all) {
      try {
        await request.jwtVerify();
      } catch {
        throw new AppError(401, "UNAUTHORIZED", "Token inválido ou ausente");
      }
      const payload = request.user as { role?: string } | undefined;
      if (!payload || payload.role !== "BARBERSHOP_ADMIN") {
        throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");
      }
    }

    const result = await useCase.execute(id, all);
    const services = result.map((s: any) => ({
      ...s,
      price: Number(s.price),
    }));
    return reply.code(200).send({ data: services });
  }
}
