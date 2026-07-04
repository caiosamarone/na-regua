import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { CreateBarbershopUseCase } from "../use-cases/create-barbershop.use-case";
import { createBarbershopInputSchema } from "../models/barbershop.schema";
import { EmailService } from "../../../shared/services/email.service";

const repository = new PrismaBarbershopRepository();
const emailService = new EmailService();
const useCase = new CreateBarbershopUseCase(repository, emailService);

export class CreateBarbershopController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = createBarbershopInputSchema.parse(request.body);
    const result = await useCase.execute(input);
    return reply.code(201).send({ data: { id: result.id, name: result.name, slug: result.slug } });
  }
}
