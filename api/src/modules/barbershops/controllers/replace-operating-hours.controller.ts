import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { ReplaceOperatingHoursUseCase } from "../use-cases/replace-operating-hours.use-case";
import { replaceOperatingHoursInputSchema } from "../models/barbershop.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new ReplaceOperatingHoursUseCase(repository);

export class ReplaceOperatingHoursController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const hours = replaceOperatingHoursInputSchema.parse(request.body);
    await useCase.execute(id, hours);
    return reply.code(200).send({ data: { message: "Horários atualizados" } });
  }
}
