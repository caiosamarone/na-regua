import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaStaffRepository } from "../gateways/prisma-staff.repository";
import { SoftDeleteStaffUseCase } from "../use-cases/soft-delete-staff.use-case";

const repository = new PrismaStaffRepository();
const useCase = new SoftDeleteStaffUseCase(repository);

export class SoftDeleteStaffController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    await useCase.execute(id);
    return reply.code(200).send({ data: { message: "Profissional desativado" } });
  }
}
