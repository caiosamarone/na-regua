import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { UpdateBarbershopStatusUseCase } from "../use-cases/update-barbershop-status.use-case";
import { updateBarbershopStatusSchema } from "../models/barbershop.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new UpdateBarbershopStatusUseCase(repository);

export class UpdateBarbershopStatusController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const { active } = updateBarbershopStatusSchema.parse(request.body);
    const result = await useCase.execute(id, active);
    return reply.code(200).send({ data: { id: result.id, active: result.active } });
  }
}
