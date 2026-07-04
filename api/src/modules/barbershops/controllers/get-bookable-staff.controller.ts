import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaBarbershopRepository } from "../gateways/prisma-barbershop.repository";
import { GetBookableStaffUseCase } from "../use-cases/get-bookable-staff.use-case";
import { bookableStaffResponseSchema } from "../models/barbershop.schema";

const repository = new PrismaBarbershopRepository();
const useCase = new GetBookableStaffUseCase(repository);

export class GetBookableStaffController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const result = await useCase.execute(id);
    const response = bookableStaffResponseSchema.parse({ data: result });
    return reply.code(200).send(response);
  }
}
