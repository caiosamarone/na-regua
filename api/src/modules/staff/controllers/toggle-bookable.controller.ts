import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaStaffRepository } from "../gateways/prisma-staff.repository";
import { ToggleBookableUseCase } from "../use-cases/toggle-bookable.use-case";
import { toggleBookableInputSchema } from "../models/staff.schema";

const repository = new PrismaStaffRepository();
const useCase = new ToggleBookableUseCase(repository);

export class ToggleBookableController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const { isBookable } = toggleBookableInputSchema.parse(request.body);
    const result = await useCase.execute(id, isBookable);
    return reply.code(200).send({ data: { id: result.id, isBookable: result.isBookable } });
  }
}
