import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { GetServicesUseCase } from "../use-cases/get-services.use-case";
import { barbershopProfileResponseSchema } from "../models/barbershop.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new GetServicesUseCase(repository);

export class GetServicesController {
  async handle(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { all?: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const all = request.query.all === "true";
    const result = await useCase.execute(id, all);

    const services = result.map((s) => ({
      ...s,
      price: Number(s.price),
    }));

    return reply.code(200).send({ data: services });
  }
}
