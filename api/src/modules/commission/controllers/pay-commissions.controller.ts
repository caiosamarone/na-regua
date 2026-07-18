import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaCommissionRepository } from "../gateways/prisma-commission.repository";
import { PayCommissionsUseCase } from "../use-cases/pay-commissions.use-case";
import { payCommissionInputSchema } from "../models/commission.schema";
import { getBarbershopIdFromToken } from "../../../shared/hooks/auth.hook";

const repository = new PrismaCommissionRepository();
const useCase = new PayCommissionsUseCase(repository);

export class PayCommissionsController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const barbershopId = getBarbershopIdFromToken(request);
    const body = payCommissionInputSchema.parse(request.body);

    const result = await useCase.execute({
      barbershopId,
      staffMemberId: body.staffMemberId,
      payAll: body.payAll,
      note: body.note,
    });

    return reply.code(200).send({
      data: {
        paymentId: result.id,
        amount: Number(result.amount),
        paidAt: result.paidAt,
      },
    });
  }
}
