import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaCommissionRepository } from "../gateways/prisma-commission.repository";
import { GetBarberCommissionsUseCase } from "../use-cases/get-barber-commissions.use-case";
import { barberCommissionQuerySchema } from "../models/commission.schema";
import { getBarbershopIdFromToken } from "../../../shared/hooks/auth.hook";

const repository = new PrismaCommissionRepository();
const useCase = new GetBarberCommissionsUseCase(repository);

export class GetBarberCommissionsController {
  async handle(
    request: FastifyRequest<{ Querystring: { from?: string; to?: string; status?: string } }>,
    reply: FastifyReply,
  ) {
    const payload = request.user as { sub: string; role: string; barbershopId?: string };
    const barbershopId = getBarbershopIdFromToken(request);

    const query = barberCommissionQuerySchema.parse(request.query);

    const from = query.from ? new Date(`${query.from}T00:00:00Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59Z`) : undefined;

    const result = await useCase.execute({
      staffMemberId: payload.sub,
      barbershopId,
      from,
      to,
      status: query.status,
    });

    return reply.code(200).send({ data: result });
  }
}
