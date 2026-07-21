import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { GetGalleryUseCase } from "../use-cases/get-gallery.use-case";

const repository = new PrismaBarbershopRepository();
const useCase = new GetGalleryUseCase(repository);

export class GetGalleryController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const result = await useCase.execute(id);
    return reply.code(200).send({ data: result });
  }
}
