import { FastifyInstance } from "fastify";
import { GetAdminMetricsController } from "./controllers/get-admin-metrics.controller";
import { GetBarbershopMetricsController } from "./controllers/get-barbershop-metrics.controller";
import { GetBarberMetricsController } from "./controllers/get-barber-metrics.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function metricsRoutes(app: FastifyInstance) {
  const adminMetricsController = new GetAdminMetricsController();
  const barbershopMetricsController = new GetBarbershopMetricsController();
  const barberMetricsController = new GetBarberMetricsController();

  app.get(
    "/admin/metrics",
    {
      preHandler: [authenticate, requireRole("SUPER_ADMIN")],
    },
    adminMetricsController.handle.bind(adminMetricsController) as any,
  );

  app.get(
    "/barbershops/:id/metrics",
    {
      preHandler: [
        authenticate,
        requireRole("BARBERSHOP_ADMIN", "SUPER_ADMIN"),
      ],
    },
    barbershopMetricsController.handle.bind(barbershopMetricsController) as any,
  );

  app.get(
    "/staff/me/metrics",
    {
      preHandler: [authenticate, requireRole("BARBER", "BARBERSHOP_ADMIN")],
    },
    barberMetricsController.handle.bind(barberMetricsController) as any,
  );
}
