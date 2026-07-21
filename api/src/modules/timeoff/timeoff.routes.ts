import { FastifyInstance } from "fastify";
import { CreateTimeOffController } from "./controllers/create-timeoff.controller";
import { ListStaffTimeOffController } from "./controllers/list-staff-timeoff.controller";
import { ListBarbershopTimeOffController } from "./controllers/list-barbershop-timeoff.controller";
import { DeleteTimeOffController } from "./controllers/delete-timeoff.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function timeOffRoutes(app: FastifyInstance) {
  const createController = new CreateTimeOffController();
  const listStaffController = new ListStaffTimeOffController();
  const listBarbershopController = new ListBarbershopTimeOffController();
  const deleteController = new DeleteTimeOffController();

  // BARBER routes
  app.post("/staff/me/time-off", {
    preHandler: [authenticate, requireRole("BARBER")],
  }, createController.handle.bind(createController) as any);

  app.get("/staff/me/time-off", {
    preHandler: [authenticate, requireRole("BARBER")],
  }, listStaffController.handle.bind(listStaffController) as any);

  app.delete("/staff/me/time-off/:id", {
    preHandler: [authenticate, requireRole("BARBER")],
  }, deleteController.handle.bind(deleteController) as any);

  // BARBERSHOP_ADMIN routes
  app.post("/barbershops/:id/staff/:staffMemberId/time-off", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, createController.handle.bind(createController) as any);

  app.get("/barbershops/:id/time-off", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, listBarbershopController.handle.bind(listBarbershopController) as any);

  app.delete("/barbershops/:id/time-off/:id", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, deleteController.handle.bind(deleteController) as any);
}
