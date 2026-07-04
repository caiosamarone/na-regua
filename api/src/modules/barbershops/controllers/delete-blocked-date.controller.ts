import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { DeleteBlockedDateUseCase } from "../use-cases/delete-blocked-date.use-case";

const repository = new PrismaBarbershopRepository();
const useCase = new DeleteBlockedDateUseCase(repository);

export class DeleteBlockedDateController {
  async handle(
    request: FastifyRequest<{ Params: { id: string; blockedDateId: string } }>,
    reply: FastifyReply,
  ) {
    const { blockedDateId } = request.params;
    await useCase.execute(blockedDateId);
    return reply.code(200).send({ data: { message: "Data bloqueada removida" } });
  }
}
