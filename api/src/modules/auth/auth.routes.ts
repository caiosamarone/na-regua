import { FastifyInstance } from "fastify";
import { StaffLoginController } from "./controllers/staff-login.controller";
import { CustomerGoogleAuthController } from "./controllers/customer-google-auth.controller";
import { StaffLogoutController } from "./controllers/staff-logout.controller";

export async function authRoutes(app: FastifyInstance) {
  const controller = new StaffLoginController();
  const googleController = new CustomerGoogleAuthController();
  const logoutController = new StaffLogoutController();

  app.post("/auth/login", controller.handle.bind(controller));
  app.post("/auth/google", googleController.handle.bind(googleController));
  app.post("/auth/logout", logoutController.handle.bind(logoutController));
}
