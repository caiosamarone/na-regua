import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaTimeOffRepository } from "../gateways/prisma-timeoff.repository";
import { ListStaffTimeOffUseCase } from "../use-cases/list-staff-timeoff.use-case";

const repository = new PrismaTimeOffRepository();
const useCase = new ListStaffTimeOffUseCase(repository);

export class ListStaffTimeOffController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.user as { sub: string };
    const result = await useCase.execute(payload.sub);
    return reply.code(200).send({ data: result });
  }
}
