import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { StaffLoginUseCase } from "../use-cases/staff-login.use-case";
import { staffLoginInputSchema, staffLoginResponseSchema } from "../models/auth.schema";
import { JwtService } from "../../../shared/services/jwt.service";

const repository = new PrismaAuthRepository();
const service = new JwtService();
const useCase = new StaffLoginUseCase(repository, service);

export class StaffLoginController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = staffLoginInputSchema.parse(request.body);
    const result = await useCase.execute(input.email, input.password);
    const response = staffLoginResponseSchema.parse({
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        staff: {
          id: result.staff.id,
          name: result.staff.name,
          email: result.staff.email,
          role: result.staff.role,
          barbershopId: result.staff.barbershopId,
        },
      },
    });

    return reply.code(200).send(response);
  }
}
