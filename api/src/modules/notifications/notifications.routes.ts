import { FastifyInstance } from "fastify";
import { VapidPublicKeyController } from "./controllers/vapid-public-key.controller";
import { CreateSubscriptionController } from "./controllers/create-subscription.controller";
import { DeleteSubscriptionController } from "./controllers/delete-subscription.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

const vapidController = new VapidPublicKeyController();
const createSubscriptionController = new CreateSubscriptionController();
const deleteSubscriptionController = new DeleteSubscriptionController();

export async function notificationsRoutes(app: FastifyInstance) {
  app.get("/vapid-public-key", vapidController.handle.bind(vapidController));

  app.post(
    "/push/subscriptions",
    { preHandler: [authenticate, requireRole("CUSTOMER")] },
    createSubscriptionController.handle.bind(createSubscriptionController) as any,
  );

  app.delete(
    "/push/subscriptions/:id",
    { preHandler: [authenticate, requireRole("CUSTOMER")] },
    deleteSubscriptionController.handle.bind(deleteSubscriptionController) as any,
  );
}
