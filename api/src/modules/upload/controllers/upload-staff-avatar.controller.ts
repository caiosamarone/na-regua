import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaUploadRepository } from "../gateways/prisma-upload.repository";
import { UploadStaffAvatarUseCase } from "../use-cases/upload-staff-avatar.use-case";
import { CloudinaryService } from "../../../shared/services/cloudinary.service";
import { AppError } from "../../../shared/errors/app-error";

const repository = new PrismaUploadRepository();
const cloudinaryService = new CloudinaryService();
const useCase = new UploadStaffAvatarUseCase(repository, cloudinaryService);

export class UploadStaffAvatarController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.user as { sub: string; role: string; barbershopId?: string };
    if (!payload.barbershopId) throw new AppError(403, "FORBIDDEN", "Permissão insuficiente");

    const parts = request.parts();
    let fileBuffer: Buffer | null = null;
    let fileMimeType: string | null = null;
    let staffId: string | null = null;

    for await (const part of parts) {
      if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        fileMimeType = part.mimetype;
      } else if (part.type === "field" && part.fieldname === "staffId") {
        staffId = part.value as string;
      }
    }

    if (!fileBuffer || !fileMimeType) {
      return reply.status(400).send({
        error: "Nenhum arquivo enviado",
        code: "VALIDATION_ERROR",
        details: {},
      });
    }

    if (!staffId) {
      return reply.status(400).send({
        error: "staffId é obrigatório",
        code: "VALIDATION_ERROR",
        details: {},
      });
    }

    const url = await useCase.execute(payload.barbershopId, staffId, fileBuffer, fileMimeType);

    return reply.code(200).send({ data: { url } });
  }
}
