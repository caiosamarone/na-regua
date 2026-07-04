import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaStaffRepository } from "../gateways/prisma-staff.repository";
import { ListStaffUseCase } from "../use-cases/list-staff.use-case";
import { listStaffQuerySchema, listStaffResponseSchema } from "../models/staff.schema";
import { getBarbershopIdFromToken } from "../../../shared/hooks/auth.hook";

const repository = new PrismaStaffRepository();
const useCase = new ListStaffUseCase(repository);

export class ListStaffController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const barbershopId = getBarbershopIdFromToken(request);
    const { all } = listStaffQuerySchema.parse(request.query);
    const result = await useCase.execute(barbershopId, all);
    const response = listStaffResponseSchema.parse({ data: result });
    return reply.code(200).send(response);
  }
}
