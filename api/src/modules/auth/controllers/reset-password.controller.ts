import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { ResetPasswordUseCase } from "../use-cases/reset-password.use-case";
import { resetPasswordSchema, messageResponseSchema } from "../models/auth.schema";

const repository = new PrismaAuthRepository();
const useCase = new ResetPasswordUseCase(repository);

export class ResetPasswordController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = resetPasswordSchema.parse(request.body);
    await useCase.execute(input.email, input.otp, input.newPassword);
    const response = messageResponseSchema.parse({
      data: { message: "Senha redefinida com sucesso" },
    });
    return reply.code(200).send(response);
  }
}
