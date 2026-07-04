import { FastifyInstance } from "fastify";
import { GetNearbyBarbershopsController } from "./controllers/get-nearby-barbershops.controller";
import { SearchBarbershopsController } from "./controllers/search-barbershops.controller";
import { GetBarbershopProfileController } from "./controllers/get-barbershop-profile.controller";

export async function barbershopRoutes(app: FastifyInstance) {
  const nearbyController = new GetNearbyBarbershopsController();
  const searchController = new SearchBarbershopsController();
  const profileController = new GetBarbershopProfileController();

  app.get("/barbershops/nearby", nearbyController.handle.bind(nearbyController));
  app.get("/barbershops/search", searchController.handle.bind(searchController));
  app.get("/barbershops/:slugOrId", profileController.handle.bind(profileController));
}
