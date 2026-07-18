import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaCommissionRepository } from "../gateways/prisma-commission.repository";
import { ListBarbershopCommissionsUseCase } from "../use-cases/list-barbershop-commissions.use-case";
import { barbershopCommissionQuerySchema } from "../models/commission.schema";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaCommissionRepository();
const useCase = new ListBarbershopCommissionsUseCase(repository);

export class ListBarbershopCommissionsController {
  async handle(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { barberId?: string; status?: string; from?: string; to?: string; page?: string; pageSize?: string };
    }>,
    reply: FastifyReply,
  ) {
    const payload = request.user as { role: string; barbershopId?: string } | undefined;

    if (payload?.role !== "SUPER_ADMIN" && payload?.barbershopId !== request.params.id) {
      throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");
    }

    const query = barbershopCommissionQuerySchema.parse(request.query);

    const from = query.from ? new Date(`${query.from}T00:00:00Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59Z`) : undefined;

    const result = await useCase.execute({
      barbershopId: request.params.id,
      barberId: query.barberId,
      status: query.status,
      from,
      to,
      page: query.page,
      pageSize: query.pageSize,
    });

    return reply.code(200).send({ data: result.barbers });
  }
}
