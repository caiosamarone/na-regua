import { FastifyInstance } from "fastify";
import { ListServicesController } from "./controllers/list-services.controller";
import { CreateServiceController } from "./controllers/create-service.controller";
import { UpdateServiceController } from "./controllers/update-service.controller";
import { SoftDeleteServiceController } from "./controllers/soft-delete-service.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function serviceRoutes(app: FastifyInstance) {
  const listController = new ListServicesController();
  const createController = new CreateServiceController();
  const updateController = new UpdateServiceController();
  const deleteController = new SoftDeleteServiceController();

  // Public — lists only active services; ?all=true requires auth
  app.get("/barbershops/:id/services", listController.handle.bind(listController) as any);

  // Barbershop Admin
  app.post("/barbershops/:id/services", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, createController.handle.bind(createController) as any);

  app.patch("/services/:id", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, updateController.handle.bind(updateController) as any);

  app.delete("/services/:id", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, deleteController.handle.bind(deleteController) as any);
}
