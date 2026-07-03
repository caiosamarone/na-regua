import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { RefreshTokenUseCase } from "../use-cases/refresh-token.use-case";
import { refreshTokenSchema, refreshTokenResponseSchema } from "../models/auth.schema";
import { JwtService } from "../../../shared/services/jwt.service";

const repository = new PrismaAuthRepository();
const service = new JwtService();
const useCase = new RefreshTokenUseCase(repository, service);

export class RefreshTokenController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = refreshTokenSchema.parse(request.body);
    const result = await useCase.execute(input.refreshToken);
    const response = refreshTokenResponseSchema.parse({
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
    return reply.code(200).send(response);
  }
}
