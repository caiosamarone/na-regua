import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaServiceRepository } from "../gateways/prisma-service.repository";
import { UpdateServiceUseCase } from "../use-cases/update-service.use-case";
import { updateServiceInputSchema } from "../models/service.schema";

const repository = new PrismaServiceRepository();
const useCase = new UpdateServiceUseCase(repository);

export class UpdateServiceController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const input = updateServiceInputSchema.parse(request.body);
    const result = await useCase.execute(id, input);
    return reply.code(200).send({
      data: {
        ...result,
        price: Number(result.price),
      },
    });
  }
}
