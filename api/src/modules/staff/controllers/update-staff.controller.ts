import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaStaffRepository } from "../gateways/prisma-staff.repository";
import { UpdateStaffUseCase } from "../use-cases/update-staff.use-case";
import { updateStaffInputSchema } from "../models/staff.schema";

const repository = new PrismaStaffRepository();
const useCase = new UpdateStaffUseCase(repository);

export class UpdateStaffController {
  async handle(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;
    const input = updateStaffInputSchema.parse(request.body);
    const result = await useCase.execute(id, input);
    return reply
      .code(200)
      .send({
        data: {
          id: result.id,
          name: result.name,
          role: result.role,
          isBookable: result.isBookable,
          isActive: result.isActive,
          commissionPercent: result.commissionPercent ? Number(result.commissionPercent) : null,
        },
      });
  }
}
