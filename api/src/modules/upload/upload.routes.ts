import { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { UploadBarbershopLogoController } from "./controllers/upload-barbershop-logo.controller";
import { UploadStaffAvatarController } from "./controllers/upload-staff-avatar.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  const uploadLogoController = new UploadBarbershopLogoController();
  const uploadAvatarController = new UploadStaffAvatarController();

  app.post("/upload/barbershop-logo", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, uploadLogoController.handle.bind(uploadLogoController) as any);

  app.post("/upload/staff-avatar", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, uploadAvatarController.handle.bind(uploadAvatarController) as any);
}
