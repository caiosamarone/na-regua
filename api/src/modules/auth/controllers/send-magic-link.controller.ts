import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { SendMagicLinkUseCase } from "../use-cases/send-magic-link.use-case";
import { magicLinkRequestSchema } from "../models/auth.schema";
import { EmailService } from "../../../shared/services/email.service";
import { env } from "../../../config/env";

const repository = new PrismaAuthRepository();
const emailService = new EmailService();
const useCase = new SendMagicLinkUseCase(
  repository,
  emailService,
  env.FRONTEND_URL,
  env.MOBILE_MAGIC_LINK_URL,
);

export class SendMagicLinkController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = magicLinkRequestSchema.parse(request.body);
    await useCase.execute(input.email, input.client);
    return reply.code(200).send({ data: { message: "Email sent if account exists" } });
  }
}
