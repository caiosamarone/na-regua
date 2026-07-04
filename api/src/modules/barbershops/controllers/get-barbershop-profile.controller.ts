import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { GetBarbershopProfileUseCase } from "../use-cases/get-barbershop-profile.use-case";
import { barbershopProfileResponseSchema } from "../models/barbershop.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new GetBarbershopProfileUseCase(repository);

export class GetBarbershopProfileController {
  async handle(
    request: FastifyRequest<{ Params: { slugOrId: string } }>,
    reply: FastifyReply,
  ) {
    const { slugOrId } = request.params;
    const result = await useCase.execute(slugOrId);

    const services = result.services.map((s) => ({
      ...s,
      price: Number(s.price),
    }));

    const response = barbershopProfileResponseSchema.parse({
      data: { ...result, services },
    });
    return reply.code(200).send(response);
  }
}
