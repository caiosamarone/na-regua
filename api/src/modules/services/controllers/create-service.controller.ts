import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaServiceRepository } from "../gateways/prisma-service.repository";
import { CreateServiceUseCase } from "../use-cases/create-service.use-case";
import { createServiceInputSchema } from "../models/service.schema";
import { getBarbershopIdFromToken } from "../../../shared/hooks/auth.hook";

const repository = new PrismaServiceRepository();
const useCase = new CreateServiceUseCase(repository);

export class CreateServiceController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const barbershopId = getBarbershopIdFromToken(request);
    const input = createServiceInputSchema.parse(request.body);
    const result = await useCase.execute(barbershopId, input);
    return reply.code(201).send({
      data: {
        ...result,
        price: Number(result.price),
      },
    });
  }
}
