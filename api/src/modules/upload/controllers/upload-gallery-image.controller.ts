import { FastifyReply, FastifyRequest } from "fastify";
import { CloudinaryService } from "../../../shared/services/cloudinary.service";
import { UploadGalleryImageUseCase } from "../use-cases/upload-gallery-image.use-case";

const cloudinaryService = new CloudinaryService();
const useCase = new UploadGalleryImageUseCase(cloudinaryService);

export class UploadGalleryImageController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({
        error: "Nenhum arquivo enviado",
        code: "VALIDATION_ERROR",
        details: {},
      });
    }

    const buffer = await file.toBuffer();
    const mimeType = file.mimetype;

    const payload = request.user as { barbershopId?: string };
    const barbershopId = payload.barbershopId!;

    const url = await useCase.execute(barbershopId, buffer, mimeType);

    return reply.code(200).send({ data: { url } });
  }
}
