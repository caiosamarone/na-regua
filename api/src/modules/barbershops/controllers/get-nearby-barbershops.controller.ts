import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { GetNearbyBarbershopsUseCase } from "../use-cases/get-nearby-barbershops.use-case";
import { nearbyQuerySchema, barbershopListResponseSchema } from "../models/barbershop.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new GetNearbyBarbershopsUseCase(repository);

export class GetNearbyBarbershopsController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = nearbyQuerySchema.parse(request.query);
    const result = await useCase.execute(input.lat, input.lng, input.radiusKm);
    const response = barbershopListResponseSchema.parse({ data: result });
    return reply.code(200).send(response);
  }
}
