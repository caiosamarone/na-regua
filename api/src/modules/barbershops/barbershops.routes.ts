import { FastifyInstance } from "fastify";
import { SearchBarbershopsController } from "./controllers/search-barbershops.controller";
import { GetBarbershopProfileController } from "./controllers/get-barbershop-profile.controller";
import { GetBookableStaffController } from "./controllers/get-bookable-staff.controller";
import { CreateBarbershopController } from "./controllers/create-barbershop.controller";
import { UpdateBarbershopStatusController } from "./controllers/update-barbershop-status.controller";
import { UpdateBarbershopProfileController } from "./controllers/update-barbershop-profile.controller";
import { ReplaceOperatingHoursController } from "./controllers/replace-operating-hours.controller";
import { BlockedDatesController } from "./controllers/blocked-dates.controller";
import { DeleteBlockedDateController } from "./controllers/delete-blocked-date.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function barbershopRoutes(app: FastifyInstance) {
  const searchController = new SearchBarbershopsController();
  const profileController = new GetBarbershopProfileController();
  const bookableStaffController = new GetBookableStaffController();
  const createController = new CreateBarbershopController();
  const updateStatusController = new UpdateBarbershopStatusController();
  const updateProfileController = new UpdateBarbershopProfileController();
  const replaceHoursController = new ReplaceOperatingHoursController();
  const blockedDatesController = new BlockedDatesController();
  const deleteBlockedController = new DeleteBlockedDateController();

  // Public routes
  app.get("/barbershops/search", searchController.handle.bind(searchController));
  app.get("/barbershops/:slugOrId", profileController.handle.bind(profileController));
  app.get("/barbershops/:id/staff/bookable", bookableStaffController.handle.bind(bookableStaffController));
  // Super Admin routes
  app.post("/barbershops", {
    preHandler: [authenticate, requireRole("SUPER_ADMIN")],
  }, createController.handle.bind(createController) as any);

  app.patch("/barbershops/:id/status", {
    preHandler: [authenticate, requireRole("SUPER_ADMIN")],
  }, updateStatusController.handle.bind(updateStatusController) as any);

  // Barbershop Admin routes
  app.patch("/barbershops/:id/profile", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, updateProfileController.handle.bind(updateProfileController) as any);

  app.put("/barbershops/:id/operating-hours", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, replaceHoursController.handle.bind(replaceHoursController) as any);

  app.post("/barbershops/:id/blocked-dates", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, blockedDatesController.handle.bind(blockedDatesController) as any);

  app.delete("/barbershops/:id/blocked-dates/:blockedDateId", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
  }, deleteBlockedController.handle.bind(deleteBlockedController) as any);
}
