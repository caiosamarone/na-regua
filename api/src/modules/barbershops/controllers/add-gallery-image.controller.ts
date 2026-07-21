import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { AddGalleryImageUseCase } from "../use-cases/add-gallery-image.use-case";
import { addGalleryImageInputSchema } from "../models/gallery.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new AddGalleryImageUseCase(repository);

export class AddGalleryImageController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const input = addGalleryImageInputSchema.parse(request.body);
    const result = await useCase.execute(id, input.imageUrl, input.caption ?? null);
    return reply.code(201).send({ data: result });
  }
}
