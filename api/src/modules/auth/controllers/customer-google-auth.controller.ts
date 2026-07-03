import { FastifyReply, FastifyRequest } from "fastify";
import { PrismaAuthRepository } from "../gateways/prisma-auth.repository";
import { CustomerGoogleAuthUseCase } from "../use-cases/customer-google-auth.use-case";
import { JwtService } from "../../../shared/services/jwt.service";
import { GoogleAuthService } from "../../../shared/services/google.service";
import { googleAuthInputSchema, magicLinkResponseSchema } from "../models/auth.schema";

const repository = new PrismaAuthRepository();
const useCase = new CustomerGoogleAuthUseCase(repository, new JwtService(), new GoogleAuthService());

export class CustomerGoogleAuthController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const input = googleAuthInputSchema.parse(request.body);
    const result = await useCase.execute(input.idToken);

    return reply.status(200).send(
      magicLinkResponseSchema.parse({
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          customer: {
            id: result.customer.id,
            name: result.customer.name,
            email: result.customer.email,
          },
        },
      }),
    );
  }
}
