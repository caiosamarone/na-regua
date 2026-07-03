import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { ForgotPasswordUseCase } from "../use-cases/forgot-password.use-case";
import { forgotPasswordSchema, messageResponseSchema } from "../models/auth.schema";
import { EmailService } from "../../../shared/services/email.service";

const repository = new PrismaAuthRepository();
const emailService = new EmailService();
const useCase = new ForgotPasswordUseCase(repository, emailService);

export class ForgotPasswordController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = forgotPasswordSchema.parse(request.body);
    await useCase.execute(input.email);
    const response = messageResponseSchema.parse({
      data: { message: "Se o email existir, um código OTP será enviado" },
    });
    return reply.code(200).send(response);
  }
}
