import { FastifyInstance } from "fastify";
import { ListStaffController } from "./controllers/list-staff.controller";
import { InviteStaffController } from "./controllers/invite-staff.controller";
import { UpdateStaffController } from "./controllers/update-staff.controller";
import { ToggleBookableController } from "./controllers/toggle-bookable.controller";
import { SoftDeleteStaffController } from "./controllers/soft-delete-staff.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function staffRoutes(app: FastifyInstance) {
  const listController = new ListStaffController();
  const inviteController = new InviteStaffController();
  const updateController = new UpdateStaffController();
  const toggleController = new ToggleBookableController();
  const deleteController = new SoftDeleteStaffController();

  app.get("/barbershops/:id/staff", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, listController.handle.bind(listController) as any);

  app.post("/barbershops/:id/staff", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, inviteController.handle.bind(inviteController) as any);

  app.patch("/staff/:id", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, updateController.handle.bind(updateController) as any);

  app.patch("/staff/:id/bookable", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, toggleController.handle.bind(toggleController) as any);

  app.delete("/staff/:id", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, deleteController.handle.bind(deleteController) as any);
}
