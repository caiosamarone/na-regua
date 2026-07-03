import { FastifyInstance } from "fastify";
import { StaffLoginController } from "./controllers/staff-login.controller";
import { CustomerGoogleAuthController } from "./controllers/customer-google-auth.controller";
import { StaffLogoutController } from "./controllers/staff-logout.controller";
import { SendMagicLinkController } from "./controllers/send-magic-link.controller";
import { VerifyMagicLinkController } from "./controllers/verify-magic-link.controller";
import { RefreshTokenController } from "./controllers/refresh-token.controller";
import { ForgotPasswordController } from "./controllers/forgot-password.controller";
import { ResetPasswordController } from "./controllers/reset-password.controller";
import { AcceptInviteController } from "./controllers/accept-invite.controller";

export async function authRoutes(app: FastifyInstance) {
  const controller = new StaffLoginController();
  const googleController = new CustomerGoogleAuthController();
  const logoutController = new StaffLogoutController();
  const magicLinkController = new SendMagicLinkController();
  const verifyMagicLinkController = new VerifyMagicLinkController();
  const refreshController = new RefreshTokenController();
  const forgotPasswordController = new ForgotPasswordController();
  const resetPasswordController = new ResetPasswordController();
  const acceptInviteController = new AcceptInviteController();

  app.post("/auth/login", controller.handle.bind(controller));
  app.post("/auth/google", googleController.handle.bind(googleController));
  app.post("/auth/logout", logoutController.handle.bind(logoutController));
  app.post("/auth/magic-link", magicLinkController.handle.bind(magicLinkController));
  app.post("/auth/magic-link/verify", verifyMagicLinkController.handle.bind(verifyMagicLinkController));
  app.post("/auth/refresh", refreshController.handle.bind(refreshController));
  app.post("/auth/forgot-password", forgotPasswordController.handle.bind(forgotPasswordController));
  app.post("/auth/reset-password", resetPasswordController.handle.bind(resetPasswordController));
  app.post("/auth/accept-invite", acceptInviteController.handle.bind(acceptInviteController));
}
