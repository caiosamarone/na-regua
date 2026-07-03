import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { VerifyMagicLinkUseCase } from "../use-cases/verify-magic-link.use-case";
import { magicLinkVerifySchema, magicLinkResponseSchema } from "../models/auth.schema";
import { JwtService } from "../../../shared/services/jwt.service";

const repository = new PrismaAuthRepository();
const jwtService = new JwtService();
const useCase = new VerifyMagicLinkUseCase(repository, jwtService);

export class VerifyMagicLinkController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = magicLinkVerifySchema.parse(request.body);
    const result = await useCase.execute(input.token);
    const response = magicLinkResponseSchema.parse({
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        customer: result.customer,
      },
    });
    return reply.code(200).send(response);
  }
}
