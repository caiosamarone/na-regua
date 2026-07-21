import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { ReorderGalleryUseCase } from "../use-cases/reorder-gallery.use-case";
import { reorderGalleryInputSchema } from "../models/gallery.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new ReorderGalleryUseCase(repository);

export class ReorderGalleryController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const input = reorderGalleryInputSchema.parse(request.body);
    await useCase.execute(id, input.imageIds);
    return reply.code(200).send({ data: { message: "Galeria reordenada" } });
  }
}
