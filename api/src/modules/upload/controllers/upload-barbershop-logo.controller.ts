import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaUploadRepository } from "../gateways/prisma-upload.repository";
import { UploadBarbershopLogoUseCase } from "../use-cases/upload-barbershop-logo.use-case";
import { CloudinaryService } from "../../../shared/services/cloudinary.service";
import { getBarbershopIdFromToken } from "../../../shared/hooks/auth.hook";

const repository = new PrismaUploadRepository();
const cloudinaryService = new CloudinaryService();
const useCase = new UploadBarbershopLogoUseCase(repository, cloudinaryService);

export class UploadBarbershopLogoController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({
        error: "Nenhum arquivo enviado",
        code: "VALIDATION_ERROR",
        details: {},
      });
    }

    const barbershopId = getBarbershopIdFromToken(request);
    const buffer = await file.toBuffer();

    const url = await useCase.execute(barbershopId, buffer, file.mimetype);

    return reply.code(200).send({ data: { url } });
  }
}
