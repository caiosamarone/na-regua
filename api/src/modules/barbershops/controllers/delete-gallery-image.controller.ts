import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { DeleteGalleryImageUseCase } from "../use-cases/delete-gallery-image.use-case";
import { CloudinaryService } from "../../../shared/services/cloudinary.service";

const repository = new PrismaBarbershopRepository();
const cloudinaryService = new CloudinaryService();
const useCase = new DeleteGalleryImageUseCase(repository, cloudinaryService);

export class DeleteGalleryImageController {
  async handle(
    request: FastifyRequest<{ Params: { imageId: string } }>,
    reply: FastifyReply,
  ) {
    const { imageId } = request.params;
    await useCase.execute(imageId);
    return reply.code(200).send({ data: { message: "Imagem removida" } });
  }
}
