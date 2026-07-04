import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { UpdateBarbershopProfileUseCase } from "../use-cases/update-barbershop-profile.use-case";
import { updateBarbershopProfileInputSchema } from "../models/barbershop.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new UpdateBarbershopProfileUseCase(repository);

export class UpdateBarbershopProfileController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const input = updateBarbershopProfileInputSchema.parse(request.body);
    const result = await useCase.execute(id, input);
    return reply.code(200).send({ data: { id: result.id, name: result.name } });
  }
}
