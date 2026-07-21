import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaTimeOffRepository } from "../gateways/prisma-timeoff.repository";
import { ListBarbershopTimeOffUseCase } from "../use-cases/list-barbershop-timeoff.use-case";

const repository = new PrismaTimeOffRepository();
const useCase = new ListBarbershopTimeOffUseCase(repository);

export class ListBarbershopTimeOffController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const result = await useCase.execute(id);
    return reply.code(200).send({ data: result });
  }
}
