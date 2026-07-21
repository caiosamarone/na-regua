import { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { UploadBarbershopLogoController } from "./controllers/upload-barbershop-logo.controller";
import { UploadStaffAvatarController } from "./controllers/upload-staff-avatar.controller";
import { UploadGalleryImageController } from "./controllers/upload-gallery-image.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function uploadRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  const uploadLogoController = new UploadBarbershopLogoController();
  const uploadAvatarController = new UploadStaffAvatarController();
  const uploadGalleryController = new UploadGalleryImageController();

  app.post("/upload/barbershop-logo", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, uploadLogoController.handle.bind(uploadLogoController) as any);

  app.post("/upload/staff-avatar", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, uploadAvatarController.handle.bind(uploadAvatarController) as any);

  app.post("/upload/gallery-image", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, uploadGalleryController.handle.bind(uploadGalleryController) as any);
}
