import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaTimeOffRepository } from "../gateways/prisma-timeoff.repository";
import { DeleteTimeOffUseCase } from "../use-cases/delete-timeoff.use-case";

const repository = new PrismaTimeOffRepository();
const useCase = new DeleteTimeOffUseCase(repository);

export class DeleteTimeOffController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const payload = request.user as { sub: string; role: string };
    const staffMemberId = payload.role === "BARBER" ? payload.sub : undefined;
    await useCase.execute(request.params.id, staffMemberId);
    return reply.code(200).send({ data: { message: "Indisponibilidade removida" } });
  }
}
