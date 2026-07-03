import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { StaffLogoutUseCase } from "../use-cases/staff-logout.use-case";
import { logoutSchema } from "../models/auth.schema";

const repository = new PrismaAuthRepository();
const useCase = new StaffLogoutUseCase(repository);

export class StaffLogoutController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = logoutSchema.parse(request.body);
    await useCase.execute(input.refreshToken, input.allDevices);
    return reply
      .code(200)
      .send({ data: { message: "Logout realizado com sucesso" } });
  }
}
