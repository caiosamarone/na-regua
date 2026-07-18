import { FastifyInstance } from "fastify";
import { ListBarbershopCommissionsController } from "./controllers/list-barbershop-commissions.controller";
import { GetBarberCommissionsController } from "./controllers/get-barber-commissions.controller";
import { PayCommissionsController } from "./controllers/pay-commissions.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function commissionRoutes(app: FastifyInstance) {
  const listBarbershopController = new ListBarbershopCommissionsController();
  const getBarberController = new GetBarberCommissionsController();
  const payController = new PayCommissionsController();

  app.get(
    "/barbershops/:id/commissions",
    {
      preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN", "SUPER_ADMIN")],
    },
    listBarbershopController.handle.bind(listBarbershopController) as any,
  );

  app.get(
    "/staff/me/commissions",
    {
      preHandler: [authenticate, requireRole("BARBER", "BARBERSHOP_ADMIN")],
    },
    getBarberController.handle.bind(getBarberController) as any,
  );

  app.post(
    "/barbershops/:id/commissions/pay",
    {
      preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN")],
    },
    payController.handle.bind(payController) as any,
  );
}
