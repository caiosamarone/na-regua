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

  app.post("/auth/login", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, controller.handle.bind(controller));
  app.post("/auth/google", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, googleController.handle.bind(googleController));
  app.post("/auth/logout", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, logoutController.handle.bind(logoutController));
  app.post("/auth/magic-link", {
    config: {
      rateLimit: {
        max: 3, timeWindow: "1 hour",
        keyGenerator: (req) => (req.body as { email?: string })?.email ?? req.ip,
      },
    },
  }, magicLinkController.handle.bind(magicLinkController));
  app.post("/auth/magic-link/verify", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, verifyMagicLinkController.handle.bind(verifyMagicLinkController));
  app.post("/auth/refresh", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, refreshController.handle.bind(refreshController));
  app.post("/auth/forgot-password", {
    config: {
      rateLimit: {
        max: 3, timeWindow: "1 hour",
        keyGenerator: (req) => (req.body as { email?: string })?.email ?? req.ip,
      },
    },
  }, forgotPasswordController.handle.bind(forgotPasswordController));
  app.post("/auth/reset-password", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, resetPasswordController.handle.bind(resetPasswordController));
  app.post("/auth/accept-invite", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, acceptInviteController.handle.bind(acceptInviteController));
}
