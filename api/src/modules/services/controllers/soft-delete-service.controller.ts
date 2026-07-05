import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaServiceRepository } from "../gateways/prisma-service.repository";
import { SoftDeleteServiceUseCase } from "../use-cases/soft-delete-service.use-case";

const repository = new PrismaServiceRepository();
const useCase = new SoftDeleteServiceUseCase(repository);

export class SoftDeleteServiceController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    await useCase.execute(id);
    return reply.code(200).send({ data: { message: "Serviço desativado" } });
  }
}
